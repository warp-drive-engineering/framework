import type { LaborDepartment } from "./labor-department";
import type { LaborEmployee } from "./labor-employee";
import type { LaborRole } from "./labor-role";
import type { LaborStoreLocation } from "./labor-store-location";
import { Labor_Rate_Type } from "./utils/data-types";

/**
 * @class EmployeeAssignment
 */
export type EmployeeAssignment = Readonly<{
  id: string;
  storeLocation: LaborStoreLocation;
  employee: LaborEmployee;
  department: LaborDepartment;
  role: LaborRole;
  /**
   * If the rateType is `0` (hourly) this will be the hourly wage
   * If the rateType is `1` (salary) this will be the annual salary
   *
   * @param {Integer} rate an integer including minor units (int100)
   */
  rate: number;
  rateType: Labor_Rate_Type;
}>;
