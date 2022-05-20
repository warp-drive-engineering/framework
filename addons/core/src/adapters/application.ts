import type NetworkService from "labor-employee-app/services/network";
import type {
  RequestEntry,
  RequestOptions,
  RequestType,
} from "labor-employee-app/services/network";

import { assert } from "@ember/debug";
import { inject as service } from "@ember/service";
import { cached } from "@glimmer/tracking";

import type Model from "@ember-data/model";
import type Store from "@ember-data/store";
// eslint-disable-next-line ember/use-ember-data-rfc-395-imports
import type DS from "ember-data";
// eslint-disable-next-line ember/use-ember-data-rfc-395-imports
import type ModelRegistry from "ember-data/types/registries/model";

import Config from "@craftable/labor-employee-engine/config/environment";
import { JsonApiDocument } from "@craftable/labor-employee-engine/types/json-api";
import type { Dict } from "@craftable/labor-employee-engine/types/utils";

type Snapshot = DS.Snapshot;

type Identifier = { type: string; id: string; lid: string };
type FindRecordOp = {
  op: "findRecord";
  identifier: Identifier;
  options: Dict<unknown>;
  include: string | undefined;
  snapshot: Snapshot;
};
type QueryRecordsOp = {
  op: "query";
  type: keyof ModelRegistry;
  query: Dict<unknown>;
  options: Dict<unknown>;
};
type QueryOp = FindRecordOp | QueryRecordsOp;
type AdapterConfig = {
  apiHost: string;
  apiNamespace: string;
  apiCacheSoftExpires: number;
  apiCacheHardExpires: number;
};

interface RequestResponse<T extends object> {
  op: QueryOp;
  request: RequestEntry<T>;
  result: T | null;
  error: Error | null;
}

function methodForOp(op: QueryOp["op"]): RequestType {
  switch (op) {
    case "query":
    case "findRecord":
      return "GET";
    default:
      assert(`Unknown op ${String(op)}`);
  }
}

type OpSubset =
  | { op: "findRecord"; snapshot: Snapshot }
  | { op: "query"; type: keyof ModelRegistry; query?: Dict<unknown> }
  | { op: string };

function opIs<T>(_op: unknown): _op is T {
  return true;
}

function urlForOp(config: AdapterConfig, op: OpSubset): string {
  const base = `${config.apiHost}/${config.apiNamespace}`;
  switch (op.op) {
    case "query": {
      assert(`type narrow`, opIs<QueryRecordsOp>(op));
      let query: string = "";
      if (op.query) {
        query = "?";
        const parts: string[] = [];
        // do the dumb thing which is assume stable key order
        Object.keys(op.query).forEach((key) => {
          query += `${key}=${encodeURIComponent(String(op.query[key]))}`;
        });
        query += parts.join("&");
      }
      return `${base}${op.type}s${query}`;
    }
    case "findRecord":
      if ((op as FindRecordOp).snapshot.modelName === "labor-user") {
        return `${base}auth/user`;
      }
      assert(
        `Unexpected "findRecord" call for ${
          (op as FindRecordOp).snapshot.modelName
        }`
      );
    // eslint-disable-next-line no-fallthrough
    default:
      assert(`Unknown op ${String(op.op)}`);
  }
}
interface StrictRequestOptions extends RequestOptions {
  headers: Record<string, string>;
}

export default class Adapter {
  @service declare network: NetworkService;

  @cached
  get config(): AdapterConfig {
    const { apiNamespace, apiHost, apiCacheSoftExpires, apiCacheHardExpires } =
      Config;
    return { apiHost, apiNamespace, apiCacheSoftExpires, apiCacheHardExpires };
  }

  #requests: Map<string, RequestResponse<JsonApiDocument>> = new Map();
  #etags: Map<string, number> = new Map();

  async request<T extends JsonApiDocument>(
    context: QueryOp
  ): Promise<RequestResponse<T>> {
    const options: StrictRequestOptions = {
      url: urlForOp(this.config, context),
      method: methodForOp(context.op),
      headers: {},
      credentials: "include",
      mode: "cors",
      referrerPolicy: "strict-origin-when-cross-origin",
    };
    if (options.method !== "GET") {
      options.headers["Content-Type"] = "application/vnd.api+json";
    } else {
      options.headers.Accept = "application/vnd.api+json";
    }
    const requestPromise = this.network.request<T>(options);
    const cacheKey = this.network.cacheKeyFor(options);
    const request = this.network.lookup<T>(cacheKey)!;

    const response: RequestResponse<T> = {
      op: context,
      request,
      result: null,
      error: null,
    };

    this.#requests.set(cacheKey, response);
    this.#etags.set(cacheKey, request.lastUpdated);

    try {
      const result = await requestPromise;
      response.result = result;
      return response;
    } catch (error) {
      assert(
        `We expect a real error, got ${String(error)}`,
        error instanceof Error
      );
      response.error = error;
      throw error;
    } finally {
      this.#etags.set(cacheKey, response.request.lastUpdated);
    }
  }

  async findRecord(
    _store: Store,
    _schema: typeof Model,
    _id: string,
    snapshot: Snapshot
  ): Promise<JsonApiDocument> {
    const response = await this.request<JsonApiDocument>({
      op: "findRecord",
      identifier: (snapshot as unknown as { identifier: Identifier })
        .identifier,
      options: snapshot.adapterOptions,
      include: (snapshot as unknown as { include: string | undefined }).include,
      snapshot,
    });

    assert(`Expected data in the request response`, response.result !== null);

    return response.result;
  }

  _isExpired(url: string, method: RequestType, expiration: number): boolean {
    const cacheKey = this.network.cacheKeyFor({
      method,
      url,
    });

    const lastUpdated = this.#etags.get(cacheKey);

    if (lastUpdated) {
      const request = this.#requests.get(cacheKey)!;
      const current = Date.now();
      return (
        request.request.status !== "pending" &&
        current > lastUpdated + expiration
      );
    }
    return false;
  }

  _recordCacheExpired(snapshot: Snapshot, expiration: number): boolean {
    const url = urlForOp(this.config, {
      op: "findRecord",
      snapshot,
    });
    return this._isExpired(url, "GET", expiration);
  }

  shouldReloadRecord(_store: Store, snapshot: Snapshot): boolean {
    return this._recordCacheExpired(snapshot, this.config.apiCacheHardExpires);
  }

  shouldBackgroundReloadRecord(_store: Store, snapshot: Snapshot): boolean {
    return this._recordCacheExpired(snapshot, this.config.apiCacheSoftExpires);
  }

  shouldReloadQuery(
    type: keyof ModelRegistry,
    query?: Dict<unknown>
    // options: Dict<unknown>
  ) {
    const url = urlForOp(this.config, {
      op: "query",
      type,
      query,
      // options,
    });
    return this._isExpired(url, "GET", this.config.apiCacheHardExpires);
  }

  shouldBackgroundReloadQuery(
    type: keyof ModelRegistry,
    query?: Dict<unknown>
    // options: Dict<unknown>
  ) {
    const url = urlForOp(this.config, {
      op: "query",
      type,
      query,
      // options,
    });
    return this._isExpired(url, "GET", this.config.apiCacheSoftExpires);
  }

  async query(
    _store: Store,
    schema: typeof Model,
    query: Dict<unknown>,
    _recordArray: unknown,
    options?: { adapterOptions?: Dict<unknown> }
  ): Promise<JsonApiDocument> {
    const response = await this.request<JsonApiDocument>({
      op: "query",
      type: schema.modelName,
      query: query || {},
      options: options?.adapterOptions || {},
    });

    assert(
      `Expected data in the request response`,
      response.result !== null && Array.isArray(response.result.data)
    );

    return response.result;
  }

  /*
  queryRecord(
    store: Store,
    schema: ModelSchema,
    query: Dict<unknown>,
    options: { adapterOptions?: unknown }
  ): Promise<unknown>;

  createRecord(
    store: Store,
    schema: ModelSchema,
    snapshot: Snapshot
  ): Promise<unknown>;
  */

  constructor(args: unknown) {
    Object.assign(this, args);
  }

  static create(args: unknown) {
    return new this(args);
  }
}

declare module "ember-data/types/registries/adapter" {
  export default interface AdapterRegistry {
    application: Adapter;
  }
}
