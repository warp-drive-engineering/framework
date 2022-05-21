import { ISO_8601_Timestamp } from "../date-and-time";
import { LaborEmployee } from "./labor-employee";
import { LaborStoreLocation } from "./labor-store-location";
import { Labor_Availability_Type } from "./utils/data-types";

export type EmployeeAvailability = Readonly<{
  storeLocation: LaborStoreLocation;
  employee: LaborEmployee;
  startTimestamp: ISO_8601_Timestamp;
  endTimestamp: ISO_8601_Timestamp;
  approved: boolean;
  availabilityType: Labor_Availability_Type;
  approvedByName: string;
  approvedById: string;
}>;
