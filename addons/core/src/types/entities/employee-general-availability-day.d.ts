import { DayOfWeek, HH_mm_00 } from "../date-and-time";
import { Labor_Availability_Type } from "./utils/data-types";

export type EmployeeGeneralAvailabilityDay = Readonly<{
  dayOfWeek: DayOfWeek;
  startTime: HH_mm_00;
  endTime: HH_mm_00;
  availabilityType: Labor_Availability_Type;
}>;
