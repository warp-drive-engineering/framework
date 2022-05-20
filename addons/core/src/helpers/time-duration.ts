import { helper } from "@ember/component/helper";

export function date([date]: [Date]): string {
  return date.toLocaleDateString("en-us", {
    weekday: "long",
  });
}

export default helper(date);
