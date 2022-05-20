import fetch from 'fetch';
import config from 'labor-employee-app/config/environment';

import { assert } from '@ember/debug';
import type RouterService from '@ember/routing/router-service';
import Service, { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

import type NetworkService from './network';
import type { RequestOptions } from './network';
import type StorageService from './storage';

export default class extends Service {
  @service declare network: NetworkService;
  @service declare storage: StorageService;
  @service declare router: RouterService;

  @tracked isAuthenticated = false;
  @tracked sessionUserId: string | null = null;
  @tracked sessionToken: string = '';

  sessionKey = `craftable-session-user-id`;
  sessionTokenKey = `craftable-session-token`;

  constructor(...args: Object[]) {
    super(...args);
    const id = this.storage.getValue<string>(this.sessionKey);
    const token = this.storage.getValue<string>(this.sessionTokenKey);

    if (id && token) {
      this.isAuthenticated = true;
      this.sessionUserId = id;
      this.sessionToken = token;
    }
  }

  async logout(delay: number = 0): Promise<void> {
    await fetch(`${config.apiHost}/signout`, {
      credentials: 'include',
      mode: 'cors',
    });
    this.sessionUserId = null;
    this.isAuthenticated = false;
    this.sessionToken = '';
    this.storage.clearValue(this.sessionKey);
    this.storage.clearValue(this.sessionTokenKey);

    const { host, protocol } = window.location;
    const newUrl = `${protocol}//${host}`;

    await new Promise((resolve) => setTimeout(resolve, delay));
    if (delay) {
      const launchScreen = document.querySelector('#launch-screen');
      assert(`Expected the #launchScreen to still be in DOM`, launchScreen);
      launchScreen.classList.remove('hidden');
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    window.location.href = newUrl;
  }

  async attemptLogin(email: string, password: string): Promise<void> {
    const options: RequestOptions = {
      url: `${config.apiHost}/${config.apiNamespace}login`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
      body: JSON.stringify({ email, password }),
    };
    const data = await this.network.request<{ userId: string | number }>(
      options
    );
    assert(
      `expected well formed user data in the response, got "null"`,
      data !== null && data.userId
    );
    const cacheKey = this.network.cacheKeyFor(options);
    const request = this.network.lookup(cacheKey);
    const sessionToken = request?.result?.headers.get('Set-Authorization');

    assert(
      `Expected a session token, but no session token was received`,
      sessionToken
    );
    this.sessionUserId = String(data.userId);
    this.sessionToken = sessionToken;
    this.isAuthenticated = true;
    this.storage.setValue(this.sessionKey, this.sessionUserId);
    this.storage.setValue(this.sessionTokenKey, this.sessionToken);
  }
}
