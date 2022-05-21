export type d = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0;
export type _1To9 = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type _0To5 = 0 | 1 | 2 | 3 | 4 | 5;
export type _1To4 = 1 | 2 | 3 | 4;

export type h = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type H = `0${d}` | `1${d}` | `2${0 | 1 | 2 | 3}`; // 24 handled separately
export type a = "am" | "pm";

// dates
export type MM = `0${_1To9}` | `1${0 | 1 | 2}`;
export type YYYY = `19${d}${d}` | `20${d}${d}`;
export type DD = `${0}${_1To9}` | `${1 | 2}${d}` | `3${0 | 1}`;

// times
export type mm = `${_0To5}${d}`;
export type ss = mm;
// larger hour numbers should still pass but if not we'll adjust to a simple string
export type DurationString = `${H}:${mm}:${ss}`;
export type hh_mm_a = `${h}:${mm} ${a}`;
export type HH_mm_00 = `${H}:${mm}:00` | "24:00:00";
export type HH_mm_ss = `${H}:${mm}:${ss}` | "24:00:00";

export interface WeekdayCodes {
  Sunday: 0;
  Monday: 1;
  Tuesday: 2;
  Wednesday: 3;
  Thursday: 4;
  Friday: 5;
  Saturday: 6;
}

export type ISO_8601_Timestamp = string;

export type DayOfWeek = WeekdayCodes[keyof WeekdayCodes];

export type YYYY_MM_DD = `${YYYY}-${MM}-${DD}`;
