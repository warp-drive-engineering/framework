import { action } from '@ember/object';
import type RouterService from '@ember/routing/router-service';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';

export default class extends Component<{ fallbackUrl: string }> {
  @service declare router: RouterService;

  @action
  goBack(event: Event) {
    event.preventDefault();
    if (history.length > 0) {
      // TODO don't allow back navigation to leave the app
      history.back();
    } else {
      void this.router.transitionTo(this.args.fallbackUrl);
    }
  }
}
