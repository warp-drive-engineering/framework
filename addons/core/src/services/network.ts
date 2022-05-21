import fetch from 'fetch';

import { getOwner } from '@ember/application';
import { assert } from '@ember/debug';
import RegistryProxyMixin from '@ember/engine/-private/registry-proxy-mixin';
import type RouterService from '@ember/routing/router-service';
import Service, { inject as service } from '@ember/service';

import type AuthService from './auth';

interface Config {
  sessionKey?: string;
  sessionTokenKey?: string;
  apiHost: string;
  apiNamespace: string;
  fetchTimeout?: number;
}

const THIRTY_SECONDS = 30_000;
const NOT_AUTHORIZED = 401;
const NO_CONTENT = 204;
const RESET_CONTENT = 205;

export interface RequestOptions extends RequestInit {
  url: string;
  method: RequestType;
}
export type RequestType =
  | 'GET'
  | 'PUT'
  | 'PATCH'
  | 'POST'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD';
export interface RequestEntry<T extends object> {
  promise: Promise<Response>;
  result: Response | null;
  status: 'pending' | 'processing' | 'fulfilled' | 'failed';
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

function handlePossibleAbort<T extends object>(
  request: RequestEntry<T>,
  error: Error
): Error {
  let e = error;
  if (error.message === 'Aborted' && request.controller.signal.aborted) {
    const signal = request.controller.signal as AbortSignal & {
      reason?: string;
    };
    e = new Error(signal.reason || error.message);
  }
  return e;
}
export default class extends Service {
  @service declare router: RouterService;
  @service declare auth: AuthService;

  declare config: Config;
  #requests: Map<string, RequestEntry<object>> = new Map();

  constructor(...args: object[]) {
    super(...args);
    const owner: RegistryProxyMixin = getOwner(this) as RegistryProxyMixin;
    this.config = owner.resolveRegistration('config:environment') as Config;
  }

  lookup<T extends Object>(key: string): RequestEntry<T> | undefined {
    return this.#requests.get(key) as RequestEntry<T>;
  }

  cacheKeyFor(options: RequestOptionsSubset) {
    const { method, url } = options;
    if (!method) {
      method === 'GET';
    }

    return `(${method}) ${url}`;
  }

  handleError(request: RequestEntry<object>): void {
    if (
      request.result?.status === NOT_AUTHORIZED &&
      this.router.currentRouteName !== 'signin'
    ) {
      void this.router.transitionTo('auto-logout');
    }
  }

  _initializeRequest<T extends object>(options: RequestOptions) {
    const { url } = options;
    const { apiHost } = this.config;
    const headers: Record<string, string> = {};

    if (url.includes(apiHost)) {
      const token: string = this.auth.sessionToken;
      headers.Authorization = `Bearer ${token}`;
    }

    const finalizedOptions: FinalizedRequestInit = Object.assign(
      { method: 'GET', headers: {} },
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
      status: 'pending',
      result: null,
      error: null,
      data: null,
      lastUpdated: Date.now(),
      controller: new AbortController(),
    };
    request.options.signal = request.controller.signal;
    this.#requests.set(cacheKey, request);

    return request;
  }

  async request<T extends object>(options: RequestOptions) {
    const { url } = options;
    const request = this._initializeRequest<T>(options);

    const id = setTimeout(
      () =>
        request.controller.abort(
          `Request was cancelled because no connection to the server was established after 10s.`
        ),
      this.config.fetchTimeout || THIRTY_SECONDS
    );
    try {
      const result = (request.result = await (request.promise = fetch(
        url,
        request.options
      )));
      clearTimeout(id);
      request.status = 'processing';
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
        status === NO_CONTENT ||
        status === RESET_CONTENT ||
        request.options.method === 'HEAD';

      request.data =
        rawPayload === '' || rawPayload === null || statusIndicatesEmptyResponse
          ? null
          : (JSON.parse(rawPayload) as T);

      request.status = 'fulfilled';
      request.lastUpdated = Date.now();

      return request.data;
    } catch (error) {
      clearTimeout(id);
      assert(
        `We expect a real error, got ${String(error)}`,
        error instanceof Error
      );

      request.error = handlePossibleAbort(request, error);
      request.status = 'failed';
      request.lastUpdated = Date.now();

      // TODO how to nicely allow this?
      this.handleError(request);

      throw request.error;
    }
  }
}
