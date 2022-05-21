/**
 * 0: hourly
 * 1: salaried
 */
export type Labor_Rate_Type = 0 | 1;

/**
 * 0: open
 * 1: employee
 */
export type Labor_Shift_Type = 0 | 1;

/**
 * 0: does not have POS integration
 * 1: has POS integration
 */
export type Has_Labor_POS_Integration = 0 | 1;

/**
  AVAILABILITY_TYPE_UNAVAILABLE_VACATION = 0,
  AVAILABILITY_TYPE_AVAILABLE_BY_TIME = 1,
  AVAILABILITY_TYPE_AVAILABLE_WHOLE_DAY = 2,
  AVAILABILITY_TYPE_UNAVAILABLE_WHOLE_DAY = 3,
  AVAILABILITY_TYPE_UNAVAILABLE_BY_TIME = 4;
 */
export type Labor_Availability_Type = 0 | 1 | 2 | 3 | 4;
