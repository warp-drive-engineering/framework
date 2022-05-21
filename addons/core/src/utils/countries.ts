import type {
  CountriesWithProvinces,
  Country,
  CountryIso2Code,
  CountryName,
  Province,
} from '../types/countries';
import type { SupportedLocales } from '../types/languages';
import type { EN_US_Provinces } from '../types/utils/province-list-en-us';

const A = 65;
const Z = 90;

type ProvinceList<K extends CountriesWithProvinces = CountriesWithProvinces> = {
  [key in K]: EN_US_Provinces[K] | undefined;
};

const LANG_MAP: Map<SupportedLocales, Country[]> = new Map();
const LOCALE_MAP: Map<SupportedLocales, ProvinceList> = new Map();

type PotentialCountryName = CountryName | CountryIso2Code | undefined;

function nameIsCountryName(
  name: PotentialCountryName,
  code: CountryIso2Code
): name is CountryName {
  return !!name && name !== code;
}

export async function getCountries(
  lang: SupportedLocales = 'en-us'
): Promise<Country[]> {
  let list: Country[] | undefined = LANG_MAP.get(lang);

  if (list === undefined) {
    const countryName = new Intl.DisplayNames([lang], { type: 'region' });
    list = [];
    for (let i = A; i <= Z; ++i) {
      for (let j = A; j <= Z; ++j) {
        const iso2: CountryIso2Code = (String.fromCharCode(i) +
          String.fromCharCode(j)) as CountryIso2Code;
        const name: PotentialCountryName = countryName.of(
          iso2
        ) as PotentialCountryName;

        if (nameIsCountryName(name, iso2)) {
          list.push({ name, iso2 });
        }
      }
    }
    LANG_MAP.set(lang, list);
  }

  // we do this because we want this to be
  // an async function in case we later
  // need to load data from an API.
  await Promise.resolve();
  return list;
}

export async function getProvinces<C extends CountriesWithProvinces>(
  country: C,
  locale: SupportedLocales = 'en-us'
): Promise<Province<C>[] | undefined> {
  let localeMap = LOCALE_MAP.get(locale);

  if (!localeMap) {
    // TODO lookup via a map if we support more than en-us
    const result = await fetch(`/assets/provinces/en-us.json`);
    localeMap = (await result.json()) as ProvinceList;
    LOCALE_MAP.set(locale, localeMap);
  }

  const list = localeMap[country];
  return list as unknown as Province<C>[];
}
