import type { LaborEmployee } from "./labor-employee";
import type { ScheduleShift } from "./schedule-shift";

export type ScheduleShiftRequest = Readonly<{
  shift: ScheduleShift;
  employee: LaborEmployee;
  /**
   * milliseconds since the epoch (long)
   */
  requestedAt: number;
  note: string | null;
}>;
