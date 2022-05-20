import { helper } from "@ember/component/helper";

export function date(
  [date, timeZone]: [Date, string],
  { showYear }: { showYear?: boolean }
): string {
  return date.toLocaleDateString("en-us", {
    timeZone,
    year: showYear ? "numeric" : undefined,
    day: "numeric",
    month: "numeric",
  });
}

export default helper(date);
