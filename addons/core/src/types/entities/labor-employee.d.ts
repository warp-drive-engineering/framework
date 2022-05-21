import { CountryIso2Code, ProvinceNames } from "../countries";
import { YYYY_MM_DD } from "../date-and-time";
import type { EmployeeAssignment } from "./employee-assignment";
import type { EmployeeAvailability } from "./employee-availability";
import type { EmployeeDocument } from "./employee-document";
import type { EmployeeGeneralAvailability } from "./employee-general-availability";
import type { LaborStoreLocation } from "./labor-store-location";
import type { LaborUser } from "./labor-user";

/**
 * @class LaborEmployee
 */
export type LaborEmployee = Readonly<{
  id: string;
  storeLocation: LaborStoreLocation;
  departmentRoleList: ReadonlyArray<EmployeeAssignment>;
  documentList: ReadonlyArray<EmployeeDocument>;
  availabilityList: ReadonlyArray<EmployeeAvailability>;
  generalAvailability: EmployeeGeneralAvailability;

  user: LaborUser;
  dateHired: YYYY_MM_DD;

  permissions: Readonly<{
    isManager: boolean;
    viewEmployeeInfo: boolean;
    manageSchedules: boolean;
  }>;

  // concat/personal-info info fields
  email: string;
  /**
   * must begin with +, the country code then (if US)
   * the 10 digit NXX-NXX-XXXX format specified by the
   * North American Numbering Plan. Where X is 0-9 and
   * N is 2-9
   *
   * @param {String} homePhone e.g. +18005550123
   */
  homePhone: string;
  /**
   * must begin with +, the country code then (if US)
   * the 10 digit NXX-NXX-XXXX format specified by the
   * North American Numbering Plan. Where X is 0-9 and
   * N is 2-9
   *
   * @param {String} mobilePhone e.g. +18005550123
   */
  mobilePhone: string;
  birthDate: YYYY_MM_DD;
  firstName: string;
  lastName: string;
  middleInitial: string;
  preferredName: string;
  // address fields
  addr1: string;
  addr2: string;
  state: ProvinceNames;
  country: CountryIso2Code;
  city: string;
  zip: string;
}>;
