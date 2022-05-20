import EmberRouter from '@ember/routing/router';
import config from '@warp-drive/weather-tests/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {});
