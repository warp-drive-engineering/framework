import type { LaborStoreLocation } from "./labor-store-location";

export type LaborDepartment = Readonly<{
  id: string;
  storeLocation: LaborStoreLocation;
  departmentNo: string;
  name: string;
}>;
