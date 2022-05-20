import Helper from "@ember/component/helper";
import { inject as service } from "@ember/service";

export default class TransitionToHelper extends Helper {
  @service router;

  compute([url]) {
    return (event) => {
      event.preventDefault();
      this.router.transitionTo(url);
    };
  }
}
