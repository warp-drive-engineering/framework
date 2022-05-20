export function localDateFromDate(
  date: Date,
  timeZone?: string,
  locale: "en-us" | "en-US" | "en-ca" | "en-CA" = "en-US"
): string {
  return date.toLocaleDateString(locale, {
    timeZone,
  });
}
