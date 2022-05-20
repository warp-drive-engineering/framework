import { tracked } from "@glimmer/tracking";

export class AsyncValue<T> {
  @tracked data: T | null = null;

  constructor(promise: Promise<T>) {
    void promise.then((data: T) => {
      this.data = data;
    });
  }

  toJSON() {
    return { data: this.data };
  }
}
