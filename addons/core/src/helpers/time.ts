import { helper } from '@ember/component/helper';

export function date(
  [date, timeZone]: [Date, string],
  { hideTimezone }: { hideTimezone?: true }
): string {
  const withStoreTimezone = date.toLocaleTimeString([], {
    timeZone,
    timeZoneName: !timeZone || hideTimezone ? undefined : 'short',
    hour12: true,
    hour: 'numeric',
    minute: '2-digit',
  });
  if (!hideTimezone && timeZone) {
    const withDeviceTimezone = date.toLocaleTimeString([], {
      timeZoneName: 'short',
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
    });
    if (withStoreTimezone === withDeviceTimezone) {
      return date.toLocaleTimeString([], {
        timeZone,
        hour12: true,
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  }
  return withStoreTimezone;
}

export default helper(date);
