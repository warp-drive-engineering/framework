import type Store from "@ember-data/store";

import type { JsonApiDocument } from "../types/json-api";

export default class {
  normalizeResponse(_: Store, __: unknown, data: JsonApiDocument) {
    return data;
  }
  static create() {
    return new this();
  }
}
