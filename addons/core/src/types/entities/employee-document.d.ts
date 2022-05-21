import type { YYYY_MM_DD } from "../date-and-time";
import type { LaborEmployee } from "./labor-employee";
import type { LaborStoreLocation } from "./labor-store-location";

// TODO finish this out only once we have a good security model
// for the AWS storage
export type EmployeeDocument = Readonly<{
  employee: LaborEmployee;
  storeLocation: LaborStoreLocation;
  uploadDate: YYYY_MM_DD; // TODO should this include time?
  uploadedBy: string;
  uploadedByUserId: string;
  fileName: string;
  fileUrl: string;
}>;
