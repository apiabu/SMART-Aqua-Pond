"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  Settings,
  Bell,
  Droplets,
  Thermometer,
  Activity,
  Waves,
  Save,
  RotateCcw,
  ShieldCheck,
  Info,
} from "lucide-react";
import {
  getSystemSettings,
  saveSystemSettings,
} from "@/lib/api";

type Thresholds = {
  temperatureMin: string;
  temperatureMax: string;
  phMin: string;
  phMax: string;
  oxygenMin: string;
  turbidityMax: string;
  waterLevelMin: string;
};

type Notifications = {
  critical: boolean;
  warning: boolean;
  equipment: boolean;
  fishBehavior: boolean;
};

const defaultThresholds: Thresholds = {
  temperatureMin: "25",
  temperatureMax: "30",
  phMin: "6.5",
  phMax: "8.5",
  oxygenMin: "5",
  turbidityMax: "5",
  waterLevelMin: "70",
};

const defaultNotifications: Notifications = {
  critical: true,
  warning: true,
  equipment: true,
  fishBehavior: true,
};

export default function SettingsPage() {
  const [thresholds, setThresholds] =
    useState<Thresholds>(defaultThresholds);

  const [notifications, setNotifications] =
    useState<Notifications>(defaultNotifications);

  const [autoAeration, setAutoAeration] = useState(false);
  const [autoWaterChange, setAutoWaterChange] = useState(false);

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSystemSettings();

        if (!settings) {
          setMessage(
            "No saved system settings were found in MySQL."
          );
          return;
        }

        setThresholds({
          temperatureMin: String(settings.temperature_min),
          temperatureMax: String(settings.temperature_max),
          phMin: String(settings.ph_min),
          phMax: String(settings.ph_max),
          oxygenMin: String(settings.dissolved_oxygen_min),
          turbidityMax: String(settings.turbidity_max),
          waterLevelMin: String(settings.water_level_min),
        });

        setNotifications({
          critical: Boolean(settings.critical_alerts_enabled),
          warning: Boolean(settings.warning_alerts_enabled),
          equipment: Boolean(settings.equipment_alerts_enabled),
          fishBehavior: Boolean(
            settings.fish_behavior_alerts_enabled
          ),
        });

        setAutoAeration(
          Boolean(settings.auto_aeration_enabled)
        );

        setAutoWaterChange(
          Boolean(settings.auto_water_change_enabled)
        );
      } catch (error) {
        console.error(
          "Failed to load system settings:",
          error
        );

        setMessage(
          "Unable to load system settings from MySQL."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  function updateThreshold(
    key: keyof Thresholds,
    value: string
  ) {
    setThresholds((current) => ({
      ...current,
      [key]: value,
    }));

    setMessage("");
  }

  function updateNotification(
    key: keyof Notifications,
    checked: boolean
  ) {
    setNotifications((current) => ({
      ...current,
      [key]: checked,
    }));

    setMessage("");
  }

  function validateThresholds() {
    const numericValues = Object.values(thresholds).map(Number);

    if (
      Object.values(thresholds).some(
        (value) => value.trim() === ""
      ) ||
      numericValues.some(
        (value) => !Number.isFinite(value)
      )
    ) {
      setMessage(
        "Please enter valid numeric threshold values."
      );

      return false;
    }

    if (
      Number(thresholds.temperatureMin) >=
        Number(thresholds.temperatureMax) ||
      Number(thresholds.phMin) >=
        Number(thresholds.phMax) ||
      Number(thresholds.oxygenMin) < 0 ||
      Number(thresholds.turbidityMax) < 0 ||
      Number(thresholds.waterLevelMin) < 0 ||
      Number(thresholds.waterLevelMin) > 100 ||
      Number(thresholds.temperatureMin) < -10 ||
      Number(thresholds.temperatureMax) > 60 ||
      Number(thresholds.phMin) < 0 ||
      Number(thresholds.phMax) > 14
    ) {
      setMessage(
        "Check your thresholds. Ensure minimums are below maximums and values are within valid limits."
      );

      return false;
    }

    return true;
  }

  async function saveSettings() {
    if (!validateThresholds()) {
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      await saveSystemSettings({
        temperature_min: Number(
          thresholds.temperatureMin
        ),
        temperature_max: Number(
          thresholds.temperatureMax
        ),
        ph_min: Number(thresholds.phMin),
        ph_max: Number(thresholds.phMax),
        dissolved_oxygen_min: Number(
          thresholds.oxygenMin
        ),
        turbidity_max: Number(
          thresholds.turbidityMax
        ),
        water_level_min: Number(
          thresholds.waterLevelMin
        ),
        critical_alerts_enabled:
          notifications.critical,
        warning_alerts_enabled:
          notifications.warning,
        equipment_alerts_enabled:
          notifications.equipment,
        fish_behavior_alerts_enabled:
          notifications.fishBehavior,
        auto_aeration_enabled: autoAeration,
        auto_water_change_enabled: autoWaterChange,
      });

      setMessage(
        "Settings saved successfully to MySQL. Automatic control preferences are configuration only; no physical hardware command was sent."
      );
    } catch (error) {
      console.error(
        "Failed to save system settings:",
        error
      );

      setMessage(
        "Unable to save system settings to MySQL."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function resetSettings() {
    const resetThresholds = {
      ...defaultThresholds,
    };

    const resetNotifications = {
      ...defaultNotifications,
    };

    setIsSaving(true);
    setMessage("");

    try {
      await saveSystemSettings({
        temperature_min: Number(
          resetThresholds.temperatureMin
        ),
        temperature_max: Number(
          resetThresholds.temperatureMax
        ),
        ph_min: Number(resetThresholds.phMin),
        ph_max: Number(resetThresholds.phMax),
        dissolved_oxygen_min: Number(
          resetThresholds.oxygenMin
        ),
        turbidity_max: Number(
          resetThresholds.turbidityMax
        ),
        water_level_min: Number(
          resetThresholds.waterLevelMin
        ),
        critical_alerts_enabled:
          resetNotifications.critical,
        warning_alerts_enabled:
          resetNotifications.warning,
        equipment_alerts_enabled:
          resetNotifications.equipment,
        fish_behavior_alerts_enabled:
          resetNotifications.fishBehavior,
        auto_aeration_enabled: false,
        auto_water_change_enabled: false,
      });

      setThresholds(resetThresholds);
      setNotifications(resetNotifications);
      setAutoAeration(false);
      setAutoWaterChange(false);

      setMessage(
        "Default settings restored and saved to MySQL. Automatic hardware control remains inactive."
      );
    } catch (error) {
      console.error(
        "Failed to reset system settings:",
        error
      );

      setMessage(
        "Unable to reset system settings in MySQL."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function ThresholdInput({
    label,
    value,
    onChange,
    unit,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    unit: string;
  }) {
    return (
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          {label}
        </label>

        <div className="flex items-center gap-3">
          <input
            type="number"
            step="any"
            value={value}
            disabled={isLoading || isSaving}
            onChange={(event) =>
              onChange(event.target.value)
            }
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />

          <span className="min-w-12 text-sm text-slate-500">
            {unit}
          </span>
        </div>
      </div>
    );
  }

  function Toggle({
    label,
    description,
    checked,
    onChange,
  }: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }) {
    return (
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-b-0">
        <div>
          <p className="text-sm font-medium text-slate-800">
            {label}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          disabled={isLoading || isSaving}
          onClick={() => onChange(!checked)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            checked ? "bg-cyan-600" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
              checked
                ? "translate-x-6"
                : "translate-x-1"
            }`}
          />
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <Header />

        <div className="flex-1 p-5 sm:p-8">
          {/* Page Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Settings
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Configure monitoring thresholds,
                notifications, and automatic control
                preferences.
              </p>
            </div>

            <span className="w-fit rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              MySQL Data
            </span>
          </div>

          {/* Database / Prototype Notice */}
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
            <Info
              size={21}
              className="mt-0.5 shrink-0 text-cyan-700"
            />

            <div>
              <h2 className="text-sm font-semibold text-cyan-900">
                Settings persistence connected
              </h2>

              <p className="mt-1 text-sm leading-6 text-cyan-800">
                Thresholds, notification preferences,
                and automatic control preferences are
                loaded from and saved to MySQL.
                Automatic control preferences are
                configuration only and do not activate
                pumps, aerators, valves, or other
                physical equipment.
              </p>
            </div>
          </div>

          {/* Water Quality Thresholds */}
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                <Droplets size={22} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Water Quality Thresholds
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Set limits used to classify water
                  quality readings.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Thermometer
                    size={19}
                    className="text-orange-500"
                  />

                  <h3 className="font-semibold text-slate-800">
                    Water Temperature
                  </h3>
                </div>

                <div className="space-y-4">
                  <ThresholdInput
                    label="Minimum temperature"
                    value={thresholds.temperatureMin}
                    unit="°C"
                    onChange={(value) =>
                      updateThreshold(
                        "temperatureMin",
                        value
                      )
                    }
                  />

                  <ThresholdInput
                    label="Maximum temperature"
                    value={thresholds.temperatureMax}
                    unit="°C"
                    onChange={(value) =>
                      updateThreshold(
                        "temperatureMax",
                        value
                      )
                    }
                  />
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Activity
                    size={19}
                    className="text-violet-600"
                  />

                  <h3 className="font-semibold text-slate-800">
                    pH Level
                  </h3>
                </div>

                <div className="space-y-4">
                  <ThresholdInput
                    label="Minimum pH"
                    value={thresholds.phMin}
                    unit="pH"
                    onChange={(value) =>
                      updateThreshold("phMin", value)
                    }
                  />

                  <ThresholdInput
                    label="Maximum pH"
                    value={thresholds.phMax}
                    unit="pH"
                    onChange={(value) =>
                      updateThreshold("phMax", value)
                    }
                  />
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Activity
                    size={19}
                    className="text-emerald-600"
                  />

                  <h3 className="font-semibold text-slate-800">
                    Dissolved Oxygen
                  </h3>
                </div>

                <ThresholdInput
                  label="Minimum dissolved oxygen"
                  value={thresholds.oxygenMin}
                  unit="mg/L"
                  onChange={(value) =>
                    updateThreshold(
                      "oxygenMin",
                      value
                    )
                  }
                />
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Waves
                    size={19}
                    className="text-blue-600"
                  />

                  <h3 className="font-semibold text-slate-800">
                    Turbidity
                  </h3>
                </div>

                <ThresholdInput
                  label="Maximum turbidity"
                  value={thresholds.turbidityMax}
                  unit="NTU"
                  onChange={(value) =>
                    updateThreshold(
                      "turbidityMax",
                      value
                    )
                  }
                />
              </div>

              <div className="rounded-lg bg-slate-50 p-4 md:col-span-2">
                <div className="mb-4 flex items-center gap-2">
                  <Droplets
                    size={19}
                    className="text-cyan-700"
                  />

                  <h3 className="font-semibold text-slate-800">
                    Water Level
                  </h3>
                </div>

                <ThresholdInput
                  label="Minimum water level"
                  value={thresholds.waterLevelMin}
                  unit="%"
                  onChange={(value) =>
                    updateThreshold(
                      "waterLevelMin",
                      value
                    )
                  }
                />
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-400">
              These are initial prototype values.
              Confirm appropriate limits for your fish
              species, pond conditions, and sensor
              calibration before using them for real
              equipment automation.
            </p>
          </section>

          {/* Notification Preferences */}
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Bell size={22} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Notification Preferences
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Choose which alert categories are
                  enabled.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <Toggle
                label="Critical water quality alerts"
                description="For potentially dangerous readings, such as critically low dissolved oxygen."
                checked={notifications.critical}
                onChange={(checked) =>
                  updateNotification(
                    "critical",
                    checked
                  )
                }
              />

              <Toggle
                label="Water quality warnings"
                description="For readings outside the configured acceptable ranges."
                checked={notifications.warning}
                onChange={(checked) =>
                  updateNotification(
                    "warning",
                    checked
                  )
                }
              />

              <Toggle
                label="Equipment notifications"
                description="For equipment status changes and connection problems."
                checked={notifications.equipment}
                onChange={(checked) =>
                  updateNotification(
                    "equipment",
                    checked
                  )
                }
              />

              <Toggle
                label="Fish behavior alerts"
                description="For abnormal activity identified by the camera analysis system."
                checked={notifications.fishBehavior}
                onChange={(checked) =>
                  updateNotification(
                    "fishBehavior",
                    checked
                  )
                }
              />
            </div>
          </section>

          {/* Automation Preferences */}
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Settings size={22} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Automatic Control Preferences
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Store the intended automatic control
                  configuration.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <Toggle
                label="Automatic aeration"
                description="Store whether future automatic aeration should be allowed when configured oxygen conditions require it."
                checked={autoAeration}
                onChange={(checked) => {
                  setAutoAeration(checked);
                  setMessage("");
                }}
              />

              <Toggle
                label="Automatic partial water change"
                description="Store whether the future controller may manage a configured 10–25% partial water change."
                checked={autoWaterChange}
                onChange={(checked) => {
                  setAutoWaterChange(checked);
                  setMessage("");
                }}
              />
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-slate-50 p-4 text-xs leading-5 text-slate-500">
              <ShieldCheck
                size={17}
                className="mt-0.5 shrink-0"
              />

              <p>
                These preferences are saved to MySQL,
                but they do not activate pumps,
                aerators, valves, or other physical
                equipment. Hardware automation is not
                yet integrated.
              </p>
            </div>
          </section>

          {/* Save / Reset */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            {isLoading && (
              <p
                role="status"
                className="mb-4 rounded-lg bg-cyan-50 p-3 text-sm text-cyan-800"
              >
                Loading settings from MySQL...
              </p>
            )}

            {message && (
              <p
                role="status"
                aria-live="polite"
                className="mb-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700"
              >
                {message}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={resetSettings}
                disabled={isLoading || isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw size={17} />
                Reset Defaults
              </button>

              <button
                type="button"
                onClick={saveSettings}
                disabled={isLoading || isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={17} />
                {isSaving
                  ? "Saving..."
                  : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}