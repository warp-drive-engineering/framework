// import type { Object as JSONResponse } from "json-typescript";

import fetch from "fetch";
import Config from "labor-employee-app/config/environment";

import { assert } from "@ember/debug";
import type RouterService from "@ember/routing/router-service";
import Service, { inject as service } from "@ember/service";

import type AuthService from "./auth";

export interface RequestOptions extends RequestInit {
  url: string;
  method: RequestType;
}
export type RequestType =
  | "GET"
  | "PUT"
  | "PATCH"
  | "POST"
  | "DELETE"
  | "OPTIONS"
  | "HEAD";
export interface RequestEntry<T extends object> {
  promise: Promise<Response>;
  result: Response | null;
  status: "pending" | "processing" | "fulfilled" | "failed";
  error: Error | null;
  /**
   * timestamp (long) since epoch in milliseconds
   */
  lastUpdated: number;
  data: T | null;
  options: FinalizedRequestInit;
  controller: AbortController;
}
interface FinalizedRequestInit extends RequestInit {
  method: RequestType;
}

interface RequestOptionsSubset {
  url: string;
  method: RequestType;
}

export default class extends Service {
  @service declare router: RouterService;
  @service declare auth: AuthService;

  #requests: Map<string, RequestEntry<object>> = new Map();

  lookup<T extends Object>(key: string): RequestEntry<T> | undefined {
    return this.#requests.get(key) as RequestEntry<T>;
  }

  cacheKeyFor(options: RequestOptionsSubset) {
    const { method, url } = options;
    if (!method) {
      method === "GET";
    }

    return `(${method}) ${url}`;
  }

  handleError(request: RequestEntry<object>): void {
    if (
      request.result?.status === 401 &&
      this.router.currentRouteName !== "signin"
    ) {
      void this.router.transitionTo("auto-logout");
    }
  }

  async request<T extends object>(options: RequestOptions) {
    const { url } = options;
    const { apiHost } = Config;
    const headers: Record<string, string> = {};

    if (url.includes(apiHost)) {
      const token: string = this.auth.sessionToken;
      headers.Authorization = `Bearer ${token}`;
    }

    const finalizedOptions: FinalizedRequestInit = Object.assign(
      { method: "GET", headers: {} },
      options
    );
    const mandatoryHeaders = {};
    Object.assign(
      finalizedOptions.headers,
      headers,
      finalizedOptions.headers,
      mandatoryHeaders
    );

    const cacheKey = this.cacheKeyFor(options);
    const request: RequestEntry<T> = {
      options: finalizedOptions,
      promise: null as unknown as Promise<Response>,
      status: "pending",
      result: null,
      error: null,
      data: null,
      lastUpdated: Date.now(),
      controller: new AbortController(),
    };
    request.options.signal = request.controller.signal;
    this.#requests.set(cacheKey, request);
    const id = setTimeout(
      () =>
        request.controller.abort(
          `Request was cancelled because no connection to the server was established after 10s.`
        ),
      10_000
    );
    try {
      const result = (request.result = await (request.promise = fetch(
        url,
        finalizedOptions
      )));
      clearTimeout(id);
      request.status = "processing";
      request.lastUpdated = Date.now();

      let rawPayload: string | Error;

      try {
        rawPayload = await result.text();
      } catch (error) {
        assert(
          `We expect a real error, got ${String(error)}`,
          error instanceof Error
        );
        rawPayload = error;
      }

      // fetch does not throw errors for many kinds of failed requests
      if (result.ok === false || rawPayload instanceof Error) {
        const error: Error & { isAdapterError?: true } = new Error(
          `${result.status}`
        );
        error.isAdapterError = true;
        throw error;
      }

      const { status } = result;
      const statusIndicatesEmptyResponse =
        status === 204 || status === 205 || finalizedOptions.method === "HEAD";

      request.data =
        rawPayload === "" || rawPayload === null || statusIndicatesEmptyResponse
          ? null
          : (JSON.parse(rawPayload) as T);

      request.status = "fulfilled";
      request.lastUpdated = Date.now();

      return request.data;
    } catch (error) {
      clearTimeout(id);
      assert(
        `We expect a real error, got ${String(error)}`,
        error instanceof Error
      );
      let e = error;
      if (error.message === "Aborted" && request.controller.signal.aborted) {
        const signal = request.controller.signal as AbortSignal & {
          reason?: string;
        };
        e = new Error(signal.reason || error.message);
      }
      request.error = e;
      request.status = "failed";
      request.lastUpdated = Date.now();

      // TODO how to nicely allow this?
      this.handleError(request);

      throw e;
    }
  }
}
