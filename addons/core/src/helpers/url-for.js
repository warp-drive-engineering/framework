import Helper from "@ember/component/helper";
import { inject as service } from "@ember/service";

function trackActiveRoute(router) {
  // ensure we recompute anytime `router.currentURL` changes
  router.currentURL;

  // ensure we recompute whenever the `router.currentRouteName` changes
  // this is slightly overlapping with router.currentURL but there are
  // cases where route.currentURL doesn't change but the
  // router.currentRouteName has (e.g. loading and error states)
  router.currentRouteName;
}
export default class UrlForHelper extends Helper {
  @service router;

  compute([path], { route, query, model, models }) {
    // we must recompute e.g. {{url-for "buyer"}} any time the platform changes
    trackActiveRoute(this.router);
    const qp = query
      ? {
          queryParams: query,
        }
      : undefined;
    const args = [route || path];
    if (model) {
      args.push(model);
    } else if (Array.isArray(models) && models.length > 0) {
      args.push(...models);
    }
    if (qp) {
      args.push(qp);
    }
    return this.router.urlFor(...args);
  }
}
