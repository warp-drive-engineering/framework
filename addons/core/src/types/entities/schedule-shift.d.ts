import type { ISO_8601_Timestamp } from "../date-and-time";
import type { LaborEmployee } from "./labor-employee";
import type { LaborRole } from "./labor-role";
import type { LaborStoreLocation } from "./labor-store-location";
import type { Labor_Shift_Type } from "./utils/data-types";

export type ScheduleShift = Readonly<{
  scheduleId: string;
  scheduleUpdatedAt: string;
  employee: LaborEmployee | null;
  storeLocation: LaborStoreLocation;
  role: LaborRole;
  shiftType: Labor_Shift_Type;
  shiftStart: ISO_8601_Timestamp;
  shiftEnd: ISO_8601_Timestamp;
  /*
    0: pending
    1: approved
    2: not-approved
  */
  status: number;
  offered: boolean;
  offeredNote: string;

  requestedAt: ISO_8601_Timestamp | null;
  requestNote: string | null;
}>;
