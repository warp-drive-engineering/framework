import type { EmployeeGeneralAvailabilityDay } from "./employee-general-availability-day";
import type { LaborEmployee } from "./labor-employee";
import type { LaborStoreLocation } from "./labor-store-location";

export type EmployeeGeneralAvailability = Readonly<{
  storeLocation: LaborStoreLocation;
  employee: LaborEmployee;
  list: ReadonlyArray<EmployeeGeneralAvailabilityDay>;
}>;
