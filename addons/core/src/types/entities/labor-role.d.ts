import type { LaborDepartment } from "./labor-department";
import type { LaborStoreLocation } from "./labor-store-location";

export type LaborRole = Readonly<{
  id: string;
  storeLocation: LaborStoreLocation;
  department: LaborDepartment;
  roleNo: string;
  name: string;
}>;
