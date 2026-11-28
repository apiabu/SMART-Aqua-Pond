
const API_BASE_URL = "http://127.0.0.1:5000/api";

// ======================================================
// SHARED API HELPER
// ======================================================

async function requestJson<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    options
  );

  if (!response.ok) {
    throw new Error(
      `API request failed: ${path} (${response.status})`
    );
  }

  return (await response.json()) as T;
}

// ======================================================
// WATER QUALITY
// ======================================================

export type WaterQualityReading = {
  id: number;
  temperature: string | null;
  ph_level: string | null;
  tds_ppm: string | null;
  turbidity: string | null;
  water_level: string | null;
  recorded_at: string;
};

type WaterQualityResponse = {
  success: boolean;
  count: number;
  data: WaterQualityReading[];
};

export async function getWaterQualityReadings(): Promise<
  WaterQualityReading[]
> {
  const result = await requestJson<WaterQualityResponse>(
    "/water-quality",
    { cache: "no-store" }
  );

  return result.data;
}

// ======================================================
// ALERTS
// ======================================================

export type AlertSeverity = "Critical" | "Warning" | "Info";

export type AlertCategory =
  | "Water Quality"
  | "Fish Behavior"
  | "Equipment";

export type AlertRecord = {
  id: number;
  title: string;
  message: string;
  severity: AlertSeverity;
  category: AlertCategory;
  acknowledged: boolean | number;
  created_at: string;
};

type AlertsResponse = {
  success: boolean;
  count: number;
  data: AlertRecord[];
};

export async function getAlerts(): Promise<AlertRecord[]> {
  const result = await requestJson<AlertsResponse>(
    "/alerts",
    { cache: "no-store" }
  );

  return result.data;
}

export async function acknowledgeAlert(
  id: number
): Promise<void> {
  await requestJson<unknown>(
    `/alerts/${id}/acknowledge`,
    { method: "PATCH" }
  );
}

export async function acknowledgeAllAlerts(): Promise<void> {
  await requestJson<unknown>(
    "/alerts/acknowledge-all",
    { method: "PATCH" }
  );
}

// ======================================================
// FEEDING
// ======================================================

export type FeedingScheduleRecord = {
  id: number;
  feeding_time: string;
  feeding_days: string[] | string;
  amount: string | null;
  enabled: boolean | number;
  created_at: string;
  updated_at: string;
};

export type FeedingHistoryRecord = {
  id: number;
  feeding_schedule_id: number | null;
  trigger_type: "Automatic" | "Manual";
  status: "Completed" | "Failed" | "Pending";
  amount: string | null;
  fed_at: string;
};

export type FeedingScheduleInput = {
  morningTime: string;
  afternoonTime: string;
  days: string[];
};

type FeedingScheduleResponse = {
  success: boolean;
  count: number;
  data: FeedingScheduleRecord[];
};

type FeedingHistoryResponse = {
  success: boolean;
  count: number;
  data: FeedingHistoryRecord[];
};

export async function getFeedingSchedule(): Promise<
  FeedingScheduleRecord[]
> {
  const result =
    await requestJson<FeedingScheduleResponse>(
      "/feeding/schedule"
    );

  return result.data;
}

export async function saveFeedingSchedule(
  schedule: FeedingScheduleInput
): Promise<void> {
  await requestJson<unknown>(
    "/feeding/schedule",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(schedule),
    }
  );
}

export async function resetFeedingSchedule(): Promise<void> {
  await requestJson<unknown>(
    "/feeding/schedule",
    { method: "DELETE" }
  );
}

export async function getFeedingHistory(): Promise<
  FeedingHistoryRecord[]
> {
  const result =
    await requestJson<FeedingHistoryResponse>(
      "/feeding/history"
    );

  return result.data;
}

// ======================================================
// EQUIPMENT
// ======================================================

export type EquipmentLogRecord = {
  id: number;
  equipment_name: string;
  action: "ON" | "OFF";
  control_mode: "Automatic" | "Manual";
  status: "Success" | "Failed";
  details: string | null;
  recorded_at: string;
};

export type EquipmentLogInput = {
  equipment_name: string;
  action: "ON" | "OFF";
  details?: string;
};

type EquipmentLogsResponse = {
  success: boolean;
  count: number;
  data: EquipmentLogRecord[];
};

export async function getEquipmentLogs(): Promise<
  EquipmentLogRecord[]
> {
  const result =
    await requestJson<EquipmentLogsResponse>(
      "/equipment/logs"
    );

  return result.data;
}

export type ArduinoHardwareStatus = {
  configured: boolean;
  connected: boolean;
  online: boolean;
  port: string | null;
  baudRate: number;
  lastMessageAt: string | null;
  lastTelemetryAt: string | null;
  device: string | null;
  firmwareVersion: string | null;
  lastError: string | null;
  mode: "telemetry-only";
};

export async function getArduinoHardwareStatus(): Promise<
  ArduinoHardwareStatus
> {
  const result = await requestJson<{
    success: boolean;
    data: ArduinoHardwareStatus;
  }>("/hardware/status");

  return result.data;
}

export async function saveEquipmentLog(
  log: EquipmentLogInput
): Promise<void> {
  await requestJson<unknown>(
    "/equipment/logs",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(log),
    }
  );
}

// ======================================================
// AUTOMATIC AERATION STATE - PROTOTYPE
// ======================================================

export type AutomaticAerationStateRecord = {
  id: number;
  equipment_name: string;
  requested_state: "ON" | "OFF";
  last_reading_value: string | null;
};

type AutomaticAerationStateResponse = {
  success: boolean;
  data: AutomaticAerationStateRecord;
  simulation_only: boolean;
};

export async function getAutomaticAerationState(): Promise<
  AutomaticAerationStateRecord
> {
  const result =
    await requestJson<AutomaticAerationStateResponse>(
      "/equipment/automatic-aeration",
      { cache: "no-store" }
    );

  return result.data;
}
// ======================================================
// SYSTEM SETTINGS
// ======================================================

export type SystemSettingsRecord = {
  id: number;
  temperature_min: string;
  temperature_max: string;
  ph_min: string;
  ph_max: string;
  tds_max_ppm: string | null;
  turbidity_max: string;
  water_level_min: string;
  critical_alerts_enabled: boolean;
  warning_alerts_enabled: boolean;
  equipment_alerts_enabled: boolean;
  fish_behavior_alerts_enabled: boolean;
  auto_aeration_enabled: boolean;
  auto_water_change_enabled: boolean;
  updated_at: string;
};

export type SystemSettingsInput = {
  temperature_min: number;
  temperature_max: number;
  ph_min: number;
  ph_max: number;
  tds_max_ppm: number | null;
  turbidity_max: number;
  water_level_min: number;
  critical_alerts_enabled: boolean;
  warning_alerts_enabled: boolean;
  equipment_alerts_enabled: boolean;
  fish_behavior_alerts_enabled: boolean;
  auto_aeration_enabled: boolean;
  auto_water_change_enabled: boolean;
};

type SystemSettingsResponse = {
  success: boolean;
  data: SystemSettingsRecord | null;
};

export async function getSystemSettings(): Promise<
  SystemSettingsRecord | null
> {
  const result =
    await requestJson<SystemSettingsResponse>(
      "/settings",
      { cache: "no-store" }
    );

  return result.data;
}

export async function saveSystemSettings(
  settings: SystemSettingsInput
): Promise<void> {
  await requestJson<unknown>(
    "/settings",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    }
  );
}

// ======================================================
// SHARED WATER QUALITY THRESHOLD CONFIGURATION
// ======================================================

// These defaults are used only when no saved settings
// exist. A failed settings request must not silently
// fall back to defaults.

export type WaterQualityParameter =
  | "temperature"
  | "ph_level"
  | "tds_ppm"
  | "turbidity"
  | "water_level";

export type WaterQualityRange = {
  min: number;
  max: number | null;
  unit: string;
  configured?: boolean;
};

export type WaterQualityRanges = Record<
  WaterQualityParameter,
  WaterQualityRange
>;

export type WaterQualityStatus =
  | "Normal"
  | "Warning"
  | "No Data"
  | "Unconfigured";

export const DEFAULT_WATER_QUALITY_RANGES: WaterQualityRanges = {
  temperature: {
    min: 25,
    max: 30,
    unit: "°C",
  },
  ph_level: {
    min: 6.5,
    max: 8.5,
    unit: "pH",
  },
  tds_ppm: {
    min: 0,
    max: null,
    unit: "ppm",
    configured: false,
  },
  turbidity: {
    min: 0,
    max: 5,
    unit: "NTU",
  },
  water_level: {
    min: 70,
    max: 100,
    unit: "%",
  },
};

function parseSettingNumber(
  value: string,
  fallback: number
): number {
  if (value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function parseOptionalSetting(
  value: string | null
): number | null {
  if (value === null || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

export function getWaterQualityRanges(
  settings: SystemSettingsRecord | null
): WaterQualityRanges {
  if (!settings) {
    return DEFAULT_WATER_QUALITY_RANGES;
  }

  const tdsMax = parseOptionalSetting(
    settings.tds_max_ppm
  );

  return {
    temperature: {
      min: parseSettingNumber(
        settings.temperature_min,
        25
      ),
      max: parseSettingNumber(
        settings.temperature_max,
        30
      ),
      unit: "°C",
    },

    ph_level: {
      min: parseSettingNumber(
        settings.ph_min,
        6.5
      ),
      max: parseSettingNumber(
        settings.ph_max,
        8.5
      ),
      unit: "pH",
    },

    tds_ppm: {
      min: 0,
      max: tdsMax,
      unit: "ppm",
      configured: tdsMax !== null,
    },

    turbidity: {
      min: 0,
      max: parseSettingNumber(
        settings.turbidity_max,
        5
      ),
      unit: "NTU",
    },

    water_level: {
      min: parseSettingNumber(
        settings.water_level_min,
        70
      ),
      max: 100,
      unit: "%",
    },
  };
}

export function getWaterQualityStatus(
  value: string | number | null | undefined,
  range: WaterQualityRange
): WaterQualityStatus {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" &&
      value.trim() === "")
  ) {
    return "No Data";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "No Data";
  }

  if (range.configured === false) {
    return "Unconfigured";
  }

  if (numericValue < range.min) {
    return "Warning";
  }

  if (
    range.max !== null &&
    numericValue > range.max
  ) {
    return "Warning";
  }

  return "Normal";
}

export function formatWaterQualityRange(
  range: WaterQualityRange
): string {
  if (range.configured === false) {
    return "Limit not configured";
  }

  if (range.max === null) {
    return `≥ ${range.min} ${range.unit}`;
  }

  return `${range.min}–${range.max} ${range.unit}`;
}

// ======================================================
// FISH BEHAVIOR
// ======================================================

export type DetectionSource =
  | "Manual"
  | "Prototype"
  | "Camera Analysis";

export type FishBehaviorRecord = {
  id: number;
  fish_id: number | null;
  fish_name: string | null;
  species: string | null;
  activity_status: "Normal" | "Abnormal";
  behavior_type: string | null;
  description: string | null;
  detection_source: DetectionSource;
  detected_at: string;
};

type FishBehaviorResponse = {
  success: boolean;
  count: number;
  data: FishBehaviorRecord[];
};

export async function getFishBehaviorLogs(): Promise<
  FishBehaviorRecord[]
> {
  const result =
    await requestJson<FishBehaviorResponse>(
      "/fish-behavior",
      { cache: "no-store" }
    );

  return result.data;
}

// ======================================================
// FISH APPEARANCE
// ======================================================

export type FishAppearanceRecord = {
  id: number;
  fish_id: number | null;
  fish_name: string | null;
  species: string | null;
  appearance_status:
    | "Normal"
    | "Possible Abnormality";
  abnormality_type: string | null;
  description: string | null;
  detection_source: DetectionSource;
  detected_at: string;
};

type FishAppearanceResponse = {
  success: boolean;
  count: number;
  data: FishAppearanceRecord[];
};

export async function getFishAppearanceLogs(): Promise<
  FishAppearanceRecord[]
> {
  const result =
    await requestJson<FishAppearanceResponse>(
      "/fish-appearance",
      { cache: "no-store" }
    );

  return result.data;
}

// ======================================================
// FISH PROFILES
// ======================================================

export type FishProfileRecord = {
  id: number;
  fish_name: string;
  species: string;
  description: string | null;
  created_at: string;
};

type FishProfilesResponse = {
  success: boolean;
  count: number;
  data: FishProfileRecord[];
};

export async function getFishProfiles(): Promise<
  FishProfileRecord[]
> {
  const result =
    await requestJson<FishProfilesResponse>(
      "/fish-profiles",
      { cache: "no-store" }
    );

  return result.data;
}

// ======================================================
// SAVE MANUAL FISH BEHAVIOR OBSERVATION
// ======================================================

export type ManualFishBehaviorInput = {
  fish_id: number;
  activity_status: "Normal" | "Abnormal";
  behavior_type: string;
  description: string;
};

export async function saveManualFishBehavior(
  observation: ManualFishBehaviorInput
): Promise<void> {
  await requestJson<unknown>(
    "/fish-behavior",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(observation),
    }
  );
}

// ======================================================
// SAVE MANUAL FISH APPEARANCE OBSERVATION
// ======================================================

export type ManualFishAppearanceInput = {
  fish_id: number;
  appearance_status:
    | "Normal"
    | "Possible Abnormality";
  abnormality_type: string | null;
  description: string;
};

export async function saveManualFishAppearance(
  observation: ManualFishAppearanceInput
): Promise<void> {
  await requestJson<unknown>(
    "/fish-appearance",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(observation),
    }
  );
}

// ======================================================
// STEP 45.16.3.1
// AUTOMATIC WATER-CHANGE HISTORY
// ======================================================

// These types match the existing Express backend API:
// GET /api/water-change/history

export type WaterChangeCycleStatus =
  | "Requested"
  | "Completed"
  | "Cancelled";

export type WaterChangeHistoryRecord = {
  id: number;
  cycle_status: WaterChangeCycleStatus;
  target_percentage: string;
  trigger_parameter: string | null;
  trigger_value: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

type WaterChangeHistoryResponse = {
  success: boolean;
  count: number;
  data: WaterChangeHistoryRecord[];
};

// ======================================================
// GET AUTOMATIC WATER-CHANGE HISTORY
// ======================================================

export async function getWaterChangeHistory(): Promise<
  WaterChangeHistoryRecord[]
> {
  const result =
    await requestJson<WaterChangeHistoryResponse>(
      "/water-change/history",
      { cache: "no-store" }
    );

  return result.data;
}

// ======================================================
// END OF AUTOMATIC WATER-CHANGE HISTORY API
// ======================================================
