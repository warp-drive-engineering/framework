import { assert } from '@ember/debug';
import { action } from '@ember/object';
import Component from '@glimmer/component';
import { cached, tracked } from '@glimmer/tracking';

const PULL_TRIGGER_THRESHOLD = 75;
class RequestState {
  @tracked isPending = true;
  @tracked isResolved = false;
  @tracked isRejected = false;
  @tracked isFulfilled = false;
  @tracked error: Error | null = null;
}

export class RefreshState {
  @tracked isRefreshing: boolean = false;
  @tracked isPulling: boolean = false;
  @tracked request: RequestState | null = null;
  @tracked pullOffset: number = 0;
}

export default class extends Component<{
  triggerThreshold?: number;
  refresh: () => void | Promise<void>;
}> {
  @tracked state = new RefreshState();

  @cached
  get triggerThreshold() {
    return this.args.triggerThreshold || PULL_TRIGGER_THRESHOLD;
  }

  @action
  async refresh(cleanup: () => void) {
    const { state } = this;
    const req = (state.request = new RequestState());
    assert(
      `Expected a refresh method to be passed to pull-to-refresh`,
      typeof this.args.refresh === 'function'
    );
    try {
      await this.args.refresh();
      req.isFulfilled = true;
      req.isResolved = true;
      req.isPending = false;
      cleanup();
    } catch (error: unknown) {
      assert(`Expected an instance of an error`, error instanceof Error);
      req.error = error;
      req.isFulfilled = true;
      req.isRejected = true;
      req.isPending = false;
      cleanup();
    }
  }
}
