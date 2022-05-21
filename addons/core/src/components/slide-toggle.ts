import { action } from '@ember/object';
import Component from '@glimmer/component';

type Args = {
  disabled: boolean;
  checked: boolean;
  onFlip?: (val: boolean) => void;
};

let _ID = 1;
export default class extends Component<Args> {
  id = `toggle-${_ID++}`;

  @action
  flip(update: (val: boolean) => void, _event: Event) {
    if (!this.args.disabled) {
      update(!this.args.checked);
      if (this.args.onFlip) {
        this.args.onFlip(this.args.checked);
      }
    }
  }
}
