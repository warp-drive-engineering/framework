import { helper } from '@ember/component/helper';

export function eq([a, b]: [unknown, unknown]): boolean {
  return a === b;
}

export default helper(eq);
