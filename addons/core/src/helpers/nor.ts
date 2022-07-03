import { helper } from '@ember/component/helper';
import { assert } from '@ember/debug';

export function nor(params: unknown[]) {
  assert(
    `You must pass at least two params to the nor helper`,
    params.length > 1
  );
  let param;

  for (let i = 0; i < params.length; i++) {
    param = params[i];

    if (param) {
      return false;
    }
  }

  return true;
}

export default helper(nor);
