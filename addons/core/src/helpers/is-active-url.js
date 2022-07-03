import Helper from '@ember/component/helper';
import { inject as service } from '@ember/service';

export default class UrlForHelper extends Helper {
  @service router;

  compute([url]) {
    return this.router.currentURL === url;
  }
}
