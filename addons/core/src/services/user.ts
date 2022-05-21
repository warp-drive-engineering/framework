import type StorageService from "labor-employee-app/services/storage";

import { dependentKeyCompat } from "@ember/object/compat";
import Service, { inject as service } from "@ember/service";
import { cached, tracked } from "@glimmer/tracking";

import type { LaborStoreLocation } from "../types/entities/labor-store-location";
import type { LaborUser } from "../types/entities/labor-user";

export type Settings = {
  useMetricWeather: boolean;
  useDarkMode: boolean;
  useSystemDarkModePreference: boolean;
  showWeatherData: boolean;
  useCompactMode: boolean;
  showTimezoneDifferences: boolean;
  compactOpenShifts: boolean;
  compactScheduledShifts: boolean;
};

class TrackedSettings implements Settings {
  declare _user: User;
  @tracked _useMetricWeather: boolean = false;
  @tracked _useDarkMode: boolean = false;
  @tracked _useSystemDarkModePreference: boolean = true;
  @tracked _showWeatherData: boolean = true;
  @tracked _useCompactMode: boolean = false;
  @tracked _showTimezoneDifferences: boolean = true;
  @tracked _compactOpenShifts: boolean = false;
  @tracked _compactScheduledShifts: boolean = false;

  @dependentKeyCompat
  get useMetricWeather() {
    return this._useMetricWeather;
  }
  set useMetricWeather(v: boolean) {
    this._useMetricWeather = v;
    this.save();
  }

  @dependentKeyCompat
  get useDarkMode() {
    return this._useDarkMode;
  }
  set useDarkMode(v: boolean) {
    this._useDarkMode = v;
    this.save();
  }

  @dependentKeyCompat
  get useSystemDarkModePreference() {
    return this._useSystemDarkModePreference;
  }
  set useSystemDarkModePreference(v: boolean) {
    this._useSystemDarkModePreference = v;
    this.save();
  }

  @dependentKeyCompat
  get useCompactMode() {
    return this._useCompactMode;
  }
  set useCompactMode(v: boolean) {
    this._useCompactMode = v;
    this.save();
  }

  @dependentKeyCompat
  get showTimezoneDifferences() {
    return this._showTimezoneDifferences;
  }
  set showTimezoneDifferences(v: boolean) {
    this._showTimezoneDifferences = v;
    this.save();
  }

  @dependentKeyCompat
  get showWeatherData() {
    return this._showWeatherData;
  }
  set showWeatherData(v: boolean) {
    this._showWeatherData = v;
    this.save();
  }

  @dependentKeyCompat
  get compactOpenShifts() {
    return this._compactOpenShifts;
  }
  set compactOpenShifts(v: boolean) {
    this._compactOpenShifts = v;
    this.save();
  }

  @dependentKeyCompat
  get compactScheduledShifts() {
    return this._compactOpenShifts;
  }
  set compactScheduledShifts(v: boolean) {
    this._compactOpenShifts = v;
    this.save();
  }

  constructor(user: User) {
    this._user = user;
  }

  toJSON() {
    const {
      useMetricWeather,
      useDarkMode,
      useSystemDarkModePreference,
      showWeatherData,
      useCompactMode,
      showTimezoneDifferences,
      compactOpenShifts,
    } = this;
    return {
      useMetricWeather,
      useDarkMode,
      useSystemDarkModePreference,
      showWeatherData,
      useCompactMode,
      showTimezoneDifferences,
      compactOpenShifts,
    };
  }

  save() {
    this._user.storage.setValue("app-settings", this);
  }
}

export default class User extends Service {
  @tracked _user: LaborUser | null = null;
  @service declare storage: StorageService;
  @tracked declare settings: Settings;

  constructor(args: object) {
    super(args);
    const settingsData: Settings | void = this.storage.getValue("app-settings");
    const settings = new TrackedSettings(this);

    if (settingsData) {
      Object.assign(settings, settingsData);
    }

    this.settings = settings;
  }

  @cached
  get locations(): Set<LaborStoreLocation> {
    const locations = new Set<LaborStoreLocation>();
    this._user!.employeeRecords.forEach((record) => {
      locations.add(record.storeLocation);
    });
    return locations;
  }

  @cached
  get locationZips(): string[] {
    const zips: string[] = [];
    this.locations.forEach((location) => {
      zips.push(location.zip);
    });
    return zips;
  }

  setUser(user: LaborUser): void {
    this._user = user;
  }
}
