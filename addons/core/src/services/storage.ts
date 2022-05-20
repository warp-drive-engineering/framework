/* eslint-disable no-restricted-globals */
import Service from "@ember/service";

export default class extends Service {
  getValue<T>(key: string): T | void {
    const item = localStorage.getItem(key);
    if (item) {
      return JSON.parse(item) as T;
    }
  }

  setValue(key: string, value: Object | string | number | boolean | null) {
    const serialized: string = JSON.stringify(value);

    return localStorage.setItem(key, serialized);
  }

  clearValue(key: string) {
    localStorage.removeItem(key);
  }
}
