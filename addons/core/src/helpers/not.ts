import { helper } from '@ember/component/helper';

export function not([param]: [unknown]): boolean {
  return !param;
}

export default helper(not);
