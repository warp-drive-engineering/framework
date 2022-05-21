import { CountryIso2Code, ProvinceNames } from "../countries";
import { DayOfWeek, H } from "../date-and-time";

export type LaborStoreLocation = Readonly<{
  id: string;

  logoUrl: string;
  /**
   * must begin with +, the country code then (if US)
   * the 10 digit NXX-NXX-XXXX format specified by the
   * North American Numbering Plan. Where X is 0-9 and
   * N is 2-9
   *
   * @param {String} phone e.g. +18005550123
   */
  phone: string;
  /**
   * @param {string} company the location's name
   */
  company: string;

  // TODO employee manager info is needed?
  // TODO how to get contact info for employee to contact store?

  /**
   * iana timezone format
   * e.g. america/new-york
   * https://www.iana.org/time-zones
   */
  timezone: string; // iana timezone format e.g. america/new-york https://www.iana.org/time-zones
  startOfBusinessDay: H; // 0-23
  dateFormat: string; // TODO what all is valid here | no guarantees?
  startOfWeek: DayOfWeek;

  // address fields
  addr1: string;
  addr2: string;
  state: ProvinceNames;
  country: CountryIso2Code;
  city: string;
  zip: string;
}>;
