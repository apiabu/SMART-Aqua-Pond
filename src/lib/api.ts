const API_BASE_URL = "http://127.0.0.1:5000/api";

// ======================================================
// WATER QUALITY
// ======================================================

export type WaterQualityReading = {
  id: number;
  temperature: string | null;
  ph_level: string | null;
  dissolved_oxygen: string | null;
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
  const response = await fetch(`${API_BASE_URL}/water-quality`);

  if (!response.ok) {
    throw new Error("Failed to fetch water quality readings.");
  }

  const result: WaterQualityResponse = await response.json();

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
  const response = await fetch(`${API_BASE_URL}/alerts`);

  if (!response.ok) {
    throw new Error("Failed to fetch alerts.");
  }

  const result: AlertsResponse = await response.json();

  return result.data;
}

export async function acknowledgeAlert(
  id: number
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/alerts/${id}/acknowledge`,
    {
      method: "PATCH",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to acknowledge alert.");
  }
}

export async function acknowledgeAllAlerts(): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/alerts/acknowledge-all`,
    {
      method: "PATCH",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to acknowledge all alerts.");
  }
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
  const response = await fetch(
    `${API_BASE_URL}/feeding/schedule`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch feeding schedule.");
  }

  const result: FeedingScheduleResponse =
    await response.json();

  return result.data;
}

export async function saveFeedingSchedule(
  schedule: FeedingScheduleInput
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/feeding/schedule`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(schedule),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to save feeding schedule.");
  }
}

export async function resetFeedingSchedule(): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/feeding/schedule`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to reset feeding schedule.");
  }
}

export async function getFeedingHistory(): Promise<
  FeedingHistoryRecord[]
> {
  const response = await fetch(
    `${API_BASE_URL}/feeding/history`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch feeding history.");
  }

  const result: FeedingHistoryResponse =
    await response.json();

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
  const response = await fetch(
    `${API_BASE_URL}/equipment/logs`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch equipment logs.");
  }

  const result: EquipmentLogsResponse =
    await response.json();

  return result.data;
}

export async function saveEquipmentLog(
  log: EquipmentLogInput
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/equipment/logs`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(log),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to save equipment log.");
  }
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
  dissolved_oxygen_min: string;
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
  dissolved_oxygen_min: number;
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
  const response = await fetch(
    `${API_BASE_URL}/settings`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch system settings.");
  }

  const result: SystemSettingsResponse =
    await response.json();

  return result.data;
}

export async function saveSystemSettings(
  settings: SystemSettingsInput
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/settings`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to save system settings.");
  }
}

// ======================================================
// FISH BEHAVIOR
// ======================================================

export type FishBehaviorRecord = {
  id: number;
  activity_status: "Normal" | "Abnormal";
  behavior_type: string | null;
  confidence_score: string | null;
  description: string | null;
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
  const response = await fetch(
    `${API_BASE_URL}/fish-behavior`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch fish behavior logs.");
  }

  const result: FishBehaviorResponse =
    await response.json();

  return result.data;
}