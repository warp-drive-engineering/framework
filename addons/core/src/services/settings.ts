import { dependentKeyCompat } from '@ember/object/compat';
import Service, { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

import type StorageService from './storage';

export type Settings = {
  useMetricWeather: boolean;
  useDarkMode: boolean;
  useSystemDarkModePreference: boolean;
  showWeatherData: boolean;
  useCompactMode: boolean;
  showTimezoneDifferences: boolean;
};

class TrackedSettings implements Settings {
  declare _service: SettingsService;
  @tracked _useMetricWeather: boolean = false;
  @tracked _useDarkMode: boolean = false;
  @tracked _useSystemDarkModePreference: boolean = true;
  @tracked _showWeatherData: boolean = true;
  @tracked _useCompactMode: boolean = false;
  @tracked _showTimezoneDifferences: boolean = true;

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

  constructor(settingsService: SettingsService) {
    this._service = settingsService;
  }

  toJSON(): Settings {
    const {
      useMetricWeather,
      useDarkMode,
      useSystemDarkModePreference,
      showWeatherData,
      useCompactMode,
      showTimezoneDifferences,
    } = this;
    return {
      useMetricWeather,
      useDarkMode,
      useSystemDarkModePreference,
      showWeatherData,
      useCompactMode,
      showTimezoneDifferences,
    };
  }

  save(): void {
    this._service.storage.setValue('app-settings', this);
  }
}

export default class SettingsService extends Service {
  @service declare storage: StorageService;
  @tracked declare state: Settings;

  constructor(args: object) {
    super(args);
    const settingsData: Settings | void = this.storage.getValue('app-settings');
    const settings = new TrackedSettings(this);

    if (settingsData) {
      Object.assign(settings, settingsData);
    }

    this.state = settings;
  }
}
