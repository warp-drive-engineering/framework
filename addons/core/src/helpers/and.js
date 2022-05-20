import { helper } from "@ember/component/helper";
import { assert } from "@ember/debug";

export function and(params) {
  assert(
    `You must pass at least two params to the and helper`,
    params.length > 1
  );
  let param;

  for (let i = 0; i < params.length; i++) {
    param = params[i];

    if (!param) {
      return false;
    }
  }

  return true;
}

export default helper(and);
