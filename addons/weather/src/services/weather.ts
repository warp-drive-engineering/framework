import config from '@craftable/labor-employee-engine/config/environment';
import type { CountryIso2Code } from '@craftable/labor-employee-engine/types/countries';
import type { ScheduleShift } from '@craftable/labor-employee-engine/types/entities/schedule-shift';
import type { SupportedLocales } from '@craftable/labor-employee-engine/types/languages';
import type NetworkService from 'labor-employee-app/services/network';
import type StorageService from 'labor-employee-app/services/storage';

import { assert } from '@ember/debug';
import Service, { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

import type { YYYY_MM_DD } from '../types/date-and-time';
import { AsyncValue } from '../utils/async-value';
import type { ShiftDay } from './days';
import type UserService from './user';
import type { Settings } from './user';

const { weatherStackApiKey, weatherCacheExpires } = config;

export type SingleLocationWeatherData = {
  request: {
    type: 'Zipcode';
    query: string;
    language: 'en';
    unit: 'f' | 'm';
  };
  location: {
    country: string;
    lat: string;
    localtime: string;
    localtime_epoch: number;
    lon: string;
    name: string;
    region: string;
    timezone_id: string;
    utc_offset: string;
  };
  forecast: {
    [date in YYYY_MM_DD]: {
      date: YYYY_MM_DD;
      date_epoch: number;
      astro: {
        sunrise: string;
        sunset: string;
        moonrise: string;
        moonset: string;
        moon_phase: string;
        moon_illumination: number;
      };
      hourly: {
        chanceoffog: number;
        chanceoffrost: number;
        chanceofhightemp: number;
        chanceofovercast: number;
        chanceofrain: number;
        chanceofremdry: number;
        chanceofsnow: number;
        chanceofsunshine: number;
        chanceofthunder: number;
        chanceofwindy: number;
        cloudcover: number;
        dewpoint: number;
        feelslike: number;
        headindex: number;
        humidity: number;
        precip: number;
        pressure: number;
        temperature: number;
        time: string;
        uvindex: number;
        visibility: number;
        weather_code: number;
        weather_descriptions: string[];
        weather_icons: string[];
        winde_degree: number;
        wind_dir: string;
        wind_speed: number;
        windchill: number;
        windgust: number;
      }[];
      mintemp: number;
      maxtemp: number;
      avgtemp: number;
      sunhour: number;
      totalsnow: number;
      uv_index: number;
    };
  };
  current?: {};
  historical: {
    [date in YYYY_MM_DD]: {
      date: YYYY_MM_DD;
      date_epoch: number;
      astro: {
        sunrise: string;
        sunset: string;
        moonrise: string;
        moonset: string;
        moon_phase: string;
        moon_illumination: number;
      };
      hourly: {
        chanceoffog: number;
        chanceoffrost: number;
        chanceofhightemp: number;
        chanceofovercast: number;
        chanceofrain: number;
        chanceofremdry: number;
        chanceofsnow: number;
        chanceofsunshine: number;
        chanceofthunder: number;
        chanceofwindy: number;
        cloudcover: number;
        dewpoint: number;
        feelslike: number;
        headindex: number;
        humidity: number;
        precip: number;
        pressure: number;
        temperature: number;
        time: string;
        uvindex: number;
        visibility: number;
        weather_code: number;
        weather_descriptions: string[];
        weather_icons: string[];
        winde_degree: number;
        wind_dir: string;
        wind_speed: number;
        windchill: number;
        windgust: number;
      }[];
      mintemp: number;
      maxtemp: number;
      avgtemp: number;
      sunhour: number;
      totalsnow: number;
      uv_index: number;
    };
  };
};

export type WeatherData =
  | SingleLocationWeatherData
  | SingleLocationWeatherData[];

export type WeatherCode = {
  code: number;
  icon: string;
};

export interface WeatherDataResponse {
  url: string;
  lastUpdated: number;
  data: AsyncValue<WeatherData | null>;
}

interface HistoricalWeatherDataResponse {
  url: string;
  lastUpdated: number;
  historicalUrl: string;
  historicalData: WeatherData;
}

export interface CachedWeatherDataResponse {
  url: string;
  lastUpdated: number;
  data: AsyncValue<WeatherData | null>;
  historicalLastUpdated?: number;
  historicalUrl?: string;
  historicalData?: WeatherData;
}

// https://worldpopulationreview.com/country-rankings/countries-that-use-fahrenheit
const FARENHEIT_COUNTRIES = new Set([
  'MS',
  'PW',
  'VG',
  'TC',
  'KN',
  'MH',
  'BM',
  'KY',
  'AG',
  'FM',
  'BS',
  'BZ',
  'LR',
  'US',
]);

const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;

function shortIsoCode(lang: SupportedLocales): string {
  return lang.split('-')[0];
}
function oneYearPrior(date: YYYY_MM_DD): YYYY_MM_DD {
  const year = date.slice(0, 4);
  const newYear = String(Number(year) - 1);
  return `${newYear}${date.slice(4)}` as YYYY_MM_DD;
}

function formatHistoricalDate(date: Date): string {
  const historicalDate = new Date(date.getTime() - ONE_YEAR);
  return historicalDate.toLocaleDateString('en-ca');
}

type HourlyReport = ArrayType<
  SingleLocationWeatherData['forecast'][YYYY_MM_DD]['hourly']
>;

export type WeatherReport = {
  icon: string;
  time: string;
  code: number;
  desc: string;
  temp: string;
};

export type DailyWeatherReport = {
  hourly: WeatherReport[];
  icon: string;
  code: number;
  desc: string;
  highTemp: string;
  lowTemp: string;
};

function mode<T>(arr: T[]): T {
  const counts = new Map<T, number>();
  arr.forEach((v) => {
    if (counts.has(v)) {
      counts.set(v, counts.get(v)! + 1);
    } else {
      counts.set(v, 1);
    }
  });
  let highest = 0;
  let highestKey: T | null = null;
  counts.forEach((count: number, key: T) => {
    if (count >= highest) {
      highest = count;
      highestKey = key;
    }
  });
  assert(`Expected a real key`, highestKey !== null);
  return highestKey;
}

function hourFromTime(time: number): string {
  switch (time) {
    case 0:
      return '12am';
    case 300:
      return '3am';
    case 600:
      return '6am';
    case 900:
      return '9am';
    case 1200:
      return '12pm';
    case 1500:
      return '3pm';
    case 1800:
      return '6pm';
    case 2100:
      return '9pm';
    default:
      assert('Unknown hour format');
  }
}
type Deferred<T> = Promise<T> & { resolve(val?: T): void };
function defer(): Deferred<unknown> {
  let _resolve: (val?: unknown) => void;
  const promise = new Promise(
    (resolve) => (_resolve = resolve)
  ) as Deferred<unknown>;
  promise.resolve = _resolve!;
  return promise;
}

function formatTemp(temp: number, settings: Settings): number {
  if (settings.useMetricWeather) {
    return Math.round(((temp - 32) * 5) / 9);
  }
  return temp;
}

type ArrayType<T> = T extends (infer Item)[] ? Item : T;
export default class extends Service {
  @service declare network: NetworkService;
  // we utilize local storage for this response
  // because force-cache does not appear to work appropriately
  // with fetch when the response is not setting cache headers
  @service declare storage: StorageService;
  @service declare user: UserService;
  @tracked weatherCodeData: Map<number, WeatherCode> | null = null;

  cached: CachedWeatherDataResponse | null = null;
  hasLoadedStorage = false;
  _isLoadingWeatherCodes = false;
  _loaded: Deferred<unknown> = defer();
  zipcodeMap: Map<
    string,
    {
      current: SingleLocationWeatherData;
      historical?: SingleLocationWeatherData;
    }
  > = new Map();
  @tracked _reports: Map<string, AsyncValue<DailyWeatherReport>> = new Map();

  getMostRecentData(): CachedWeatherDataResponse {
    assert(`Expected cache to be populated`, this.cached);
    return this.cached;
  }

  // TODO cache this calc
  _weatherForDay(zipcode: string, day: YYYY_MM_DD): DailyWeatherReport {
    const report = this.zipcodeMap.get(zipcode);
    let hourly: WeatherReport[];
    let data = report?.current.forecast[day];
    if (!data) {
      data = report?.historical?.historical[oneYearPrior(day)];
    }
    const { settings } = this.user;

    if (!data) {
      hourly = ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm'].map(
        (time) => {
          return {
            time,
            icon: '',
            code: 0,
            desc: 'No Weather Data Available', // to intl
            temp: 'N/A',
          };
        }
      );
    } else {
      hourly = [];

      data.hourly.forEach((hour: HourlyReport) => {
        const time = Number(hour.time);
        const icon = this.weatherCodeData!.get(hour.weather_code);
        assert(`Expected an icon for weather code ${hour.weather_code}`, icon);
        hourly.push({
          time: hourFromTime(time),
          icon: icon.icon,
          code: hour.weather_code,
          desc: hour.weather_descriptions.join(', '),
          temp: `${formatTemp(hour.temperature, settings)}°}`,
        });
      });
    }

    return {
      hourly,
      lowTemp: data?.mintemp ? `${formatTemp(data.mintemp, settings)}°` : 'N/A',
      highTemp: data?.maxtemp
        ? `${formatTemp(data.maxtemp, settings)}°`
        : 'N/A',
      icon: mode(hourly.map((h) => h.icon)),
      code: mode(hourly.map((h) => h.code)),
      desc: mode(hourly.map((h) => h.desc)),
    };
  }

  weatherForDay(
    zipcode: string,
    day: YYYY_MM_DD
  ): AsyncValue<DailyWeatherReport> {
    const key = `${zipcode}:${day}`;
    let data = this._reports.get(key);
    if (!data) {
      data = new AsyncValue(
        this._loaded.then(() => {
          return this._weatherForDay(zipcode, day);
        })
      );
      this._reports.set(key, data);
    }
    return data;
  }

  update(request: HistoricalWeatherDataResponse): void;
  update(request: WeatherDataResponse): void;
  update(request: WeatherDataResponse | HistoricalWeatherDataResponse): void {
    if ('historicalUrl' in request) {
      // merge the historical data into the existing data
      const { cached } = this;
      assert(`Expected cached to have been populated`, cached);
      cached.historicalUrl = request.historicalUrl;
      cached.historicalLastUpdated = request.lastUpdated;
      cached.historicalData = request.historicalData;
      this.cached = cached;
      this.storage.setValue('weather-data-responses', this.cached);
      this._updateZipcodes(cached);
    } else {
      this._updateZipcodes(request);
      this.cached = request;
      this.storage.setValue('weather-data-responses', this.cached);
    }
  }

  _updateZipcodes(request: CachedWeatherDataResponse) {
    const theData = request.data.data;
    if (Array.isArray(theData)) {
      theData.forEach((loc) => {
        this.zipcodeMap.set(loc.request.query, {
          current: loc,
        });
      });
    } else if (theData) {
      this.zipcodeMap.set(theData.request.query, {
        current: theData,
      });
    }

    if (request.historicalData) {
      const theData = request.historicalData;
      if (Array.isArray(theData)) {
        theData.forEach((loc) => {
          const cache = this.zipcodeMap.get(loc.request.query);
          cache!.historical = loc;
        });
      } else if (theData) {
        const cache = this.zipcodeMap.get(theData.request.query);
        cache!.historical = theData;
      }
    }
  }

  // TODO cache-key by zipcode
  retrieve(url: string): WeatherDataResponse | null {
    if (!this.hasLoadedStorage) {
      const parsed = this.storage.getValue<WeatherDataResponse>(
        'weather-data-responses'
      );
      if (parsed && parsed.url === url) {
        this._updateZipcodes(parsed);
        this.cached = parsed;
      }
    }
    return this.cached;
  }

  async loadWeatherIconData() {
    if (this.weatherCodeData || this._isLoadingWeatherCodes) {
      return;
    }
    this._isLoadingWeatherCodes = true;
    const data = await this.network.request<WeatherCode[]>({
      url: '/@craftable/labor-employee-engine/assets/weather-codes.json',
      method: 'GET',
    });
    assert(`We received code data`, data);
    const codeMap = new Map();
    data.forEach((icon) => {
      codeMap.set(icon.code, icon);
    });
    this.weatherCodeData = codeMap;
    this._isLoadingWeatherCodes = false;
  }

  /**
   * @param shifts an array of shifts sorted by startDate and startTime
   */
  async weatherDataForShifts(
    shifts: ScheduleShift[],
    days: ShiftDay[],
    reload: boolean = false,
    country: CountryIso2Code = 'US',
    locale: SupportedLocales = 'en-us'
  ): Promise<AsyncValue<WeatherData | null> | void> {
    const weatherDataPromise = this.loadWeatherIconData();
    // each unique zip counts as one query against our api quota
    // we may want to cache by zips individually so we are only
    // quering stale zip codes.
    const zips =
      shifts.length === 0
        ? this.user.locationZips
        : shifts.map((shift) => shift.storeLocation.zip);
    const locations = [...new Set(zips)].join(';');
    const firstDate: string = formatHistoricalDate(days[7].dateInstance);
    const lastDate: string = formatHistoricalDate(
      days[days.length - 1].dateInstance
    );
    const historicalDateQuery = `historical_date_start=${firstDate}&historical_date_end=${lastDate}`;
    const dateQuery = `forecast_days=7`;
    const localeQuery = locale.startsWith('en')
      ? ''
      : `&language=${shortIsoCode(locale)}`;

    const params = `&query=${locations}&${dateQuery}&hourly=1&interval=3&units=${
      FARENHEIT_COUNTRIES.has(country) ? 'f' : 'm'
    }${localeQuery}`;
    const historicalParams = `&query=${locations}&${historicalDateQuery}&hourly=1&interval=3&units=${
      FARENHEIT_COUNTRIES.has(country) ? 'f' : 'm'
    }`;

    const historicalUrl = `https://api.weatherstack.com/historical?access_key=${weatherStackApiKey}${historicalParams}`;
    const url = `https://api.weatherstack.com/forecast?access_key=${weatherStackApiKey}${params}`;

    const cached = this.retrieve(url);
    if (
      !reload &&
      cached &&
      cached.lastUpdated + weatherCacheExpires > Date.now()
    ) {
      await weatherDataPromise;
      this._loaded.resolve();
      return cached.data;
    }

    const hasExpired = !!cached;
    const promise1 = this.network.request<WeatherData>({
      url,
      method: 'GET',
      cache: reload || hasExpired ? 'default' : 'force-cache',
    });
    const promise2 = this.network.request<WeatherData>({
      url: historicalUrl,
      method: 'GET',
      cache: reload || hasExpired ? 'default' : 'force-cache',
    });
    const asyncWeatherData = new AsyncValue<WeatherData | null>(promise1);
    this.update({ url, lastUpdated: Date.now(), data: asyncWeatherData });
    const weatherData = await promise1;

    assert(
      `Expected to receive weather data, no data returned`,
      weatherData !== null
    );

    this.update({ url, lastUpdated: Date.now(), data: asyncWeatherData });

    const historicalData = await promise2;

    assert(
      `Expected to receive weather data, no data returned`,
      historicalData !== null
    );

    this.update({
      url,
      lastUpdated: Date.now(),
      historicalUrl,
      historicalData,
    });

    await weatherDataPromise;
    this._loaded.resolve();
    await this._loaded;
    return asyncWeatherData;
  }
}
