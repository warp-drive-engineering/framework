import { inject as service } from '@ember/service';
import Component from '@glimmer/component';

import type PortalsService from '../services/portals';

export default class extends Component {
  @service declare portals: PortalsService;

  get headerElement() {
    return this.portals.elements.pageHeader;
  }
}
