import type { EN_US_Countries } from "./utils/country-list-en-us";
import type { EN_US_Provinces } from "./utils/province-list-en-us";

export type CountryName = EN_US_Countries[number]["name"];
export type CountryIso2Code = EN_US_Countries[number]["iso2"];
export type CountriesWithProvinces = keyof EN_US_Provinces;
export type Provinces = EN_US_Provinces[CountriesWithProvinces][number];
export type ProvinceNames = Provinces["name"] & string;
export type ProvinceShorthand = Provinces["short"] & string;

export interface Country {
  name: CountryName;
  iso2: CountryIso2Code;
}
export type Province<Country extends CountriesWithProvinces> = Readonly<{
  name: EN_US_Provinces[Country][number]["name"] & string;
  short?: EN_US_Provinces[Country][number]["short"];
  country: Country;
}>;
