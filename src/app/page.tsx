
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

import {
  getWaterQualityReadings,
  getSystemSettings,
  getWaterQualityRanges,
  getWaterQualityStatus,
  getFishBehaviorLogs,
  getAlerts,
  getFeedingSchedule,
  getFeedingHistory,
  getAutomaticAerationState,
  type WaterQualityReading,
  type WaterQualityParameter,
  type WaterQualityRange,
  type WaterQualityStatus,
} from "@/lib/api";

// ======================================================
// TYPES
// ======================================================

type FishBehavior = Awaited<
  ReturnType<typeof getFishBehaviorLogs>
>[number];

type WaterParameter = {
  key: WaterQualityParameter;
  title: string;
  value: string | number | null | undefined;
  range: WaterQualityRange | null;
  status: WaterQualityStatus;
};

type EquipmentItem = {
  name: string;
  description: string;
};

// ======================================================
// HELPERS
// ======================================================

function displayValue(
  value: string | number | null | undefined
): string {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === "" ||
    !Number.isFinite(Number(value))
  ) {
    return "--";
  }

  return String(value);
}

function formatTime(value: string | null | undefined) {
  if (!value) return "--";

  const match = value.match(/^(\d{1,2}):(\d{2})/);

  if (!match) return value;

  const hour = Number(match[1]);
  const minute = match[2];

  if (!Number.isInteger(hour) || hour > 23) {
    return value;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
}

function formatDateTime(
  value: string | null | undefined
) {
  if (!value) return "Unknown date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  });
}

function getTimestamp(value: string): number {
  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : 0;
}

function getStatusStyle(status: WaterQualityStatus) {
  switch (status) {
    case "Normal":
      return {
        dot: "bg-emerald-500",
        text: "text-emerald-700",
      };

    case "Warning":
      return {
        dot: "bg-amber-500",
        text: "text-amber-700",
      };

    default:
      return {
        dot: "bg-slate-400",
        text: "text-slate-500",
      };
  }
}

// ======================================================
// DASHBOARD
// ======================================================


export default async function Home() {
  let latestReading: WaterQualityReading | null = null;

  let fishBehaviorLogs: FishBehavior[] = [];

  let alerts: Awaited<
    ReturnType<typeof getAlerts>
  > = [];

  let feedingSchedules: Awaited<
    ReturnType<typeof getFeedingSchedule>
  > = [];

  let feedingHistory: Awaited<
    ReturnType<typeof getFeedingHistory>
  > = [];

  let ranges: ReturnType<
    typeof getWaterQualityRanges
  > | null = null;

  let automaticAeration: Awaited<
    ReturnType<typeof getAutomaticAerationState>
  > | null = null;

  let waterQualityError = false;
  let settingsError = false;
  let fishBehaviorError = false;
  let alertsError = false;
  let feedingError = false;
  let automaticAerationError = false;

  // ======================================================
  // LOAD DATA
  // ======================================================
  
const [
  readingsResult,
  settingsResult,
  behaviorResult,
  alertsResult,
  scheduleResult,
  feedingHistoryResult,
  automaticAerationResult,
] = await Promise.allSettled([
  getWaterQualityReadings(),
  getSystemSettings(),
  getFishBehaviorLogs(),
  getAlerts(),
  getFeedingSchedule(),
  getFeedingHistory(),
  getAutomaticAerationState(),
]);


  // ======================================================
  // AUTOMATIC AERATION
  // ======================================================

  if (automaticAerationResult.status === "fulfilled") {
    automaticAeration = automaticAerationResult.value;
  } else {
    automaticAerationError = true;

    console.error(
      "Failed to load automatic aeration state:",
      automaticAerationResult.reason
    );
  }


  // WATER QUALITY

  if (readingsResult.status === "fulfilled") {
    latestReading =
      [...readingsResult.value].sort(
        (a, b) =>
          getTimestamp(b.recorded_at) -
          getTimestamp(a.recorded_at)
      )[0] ?? null;
  } else {
    waterQualityError = true;
    console.error(
      "Failed to load water quality data:",
      readingsResult.reason
    );
  }

  // SETTINGS

  if (settingsResult.status === "fulfilled") {
    ranges = getWaterQualityRanges(
      settingsResult.value
    );
  } else {
    settingsError = true;
    console.error(
      "Failed to load system settings:",
      settingsResult.reason
    );
  }

  // FISH BEHAVIOR

  if (behaviorResult.status === "fulfilled") {
    fishBehaviorLogs = behaviorResult.value;
  } else {
    fishBehaviorError = true;
    console.error(
      "Failed to load fish behavior data:",
      behaviorResult.reason
    );
  }

  // ALERTS

  if (alertsResult.status === "fulfilled") {
    alerts = alertsResult.value;
  } else {
    alertsError = true;
    console.error(
      "Failed to load alerts:",
      alertsResult.reason
    );
  }

  // FEEDING

  if (scheduleResult.status === "fulfilled") {
    feedingSchedules = scheduleResult.value;
  } else {
    feedingError = true;
    console.error(
      "Failed to load feeding schedule:",
      scheduleResult.reason
    );
  }

  if (feedingHistoryResult.status === "fulfilled") {
    feedingHistory = feedingHistoryResult.value;
  } else {
    feedingError = true;
    console.error(
      "Failed to load feeding history:",
      feedingHistoryResult.reason
    );
  }

  // ======================================================
  // WATER QUALITY OVERVIEW
  // ======================================================

  const waterDefinitions: {
    key: WaterQualityParameter;
    title: string;
  }[] = [
    {
      key: "temperature",
      title: "Water Temperature",
    },
    {
      key: "ph_level",
      title: "pH Level",
    },
    {
      key: "tds_ppm",
      title: "Total Dissolved Solids (TDS)",
    },
    {
      key: "turbidity",
      title: "Turbidity",
    },
    {
      key: "water_level",
      title: "Water Level",
    },
  ];

  const waterParameters: WaterParameter[] =
    waterDefinitions.map((definition) => {
      const range = ranges?.[definition.key] ?? null;

      const value =
        latestReading?.[definition.key] ?? null;

      return {
        key: definition.key,
        title: definition.title,
        value,
        range,
        status: range
          ? getWaterQualityStatus(value, range)
          : "No Data",
      };
    });

  const hasWaterWarning = waterParameters.some(
    (parameter) => parameter.status === "Warning"
  );

  const hasMissingWaterData = waterParameters.some(
    (parameter) => parameter.status === "No Data"
  );

  const hasUnconfiguredThreshold = waterParameters.some(
    (parameter) => parameter.status === "Unconfigured"
  );

  const overallWaterStatus:
    | WaterQualityStatus
    | "Unavailable" =
    waterQualityError || settingsError
      ? "Unavailable"
      : hasWaterWarning
        ? "Warning"
        : hasMissingWaterData
          ? "No Data"
          : hasUnconfiguredThreshold
            ? "Unconfigured"
            : "Normal";

  const overallWaterStyle = getStatusStyle(
    overallWaterStatus === "Unavailable"
      ? "No Data"
      : overallWaterStatus
  );

  // ======================================================
  // FISH BEHAVIOR SUMMARY
  // ======================================================

  const latestFishBehavior =
    [...fishBehaviorLogs].sort(
      (a, b) =>
        getTimestamp(b.detected_at) -
        getTimestamp(a.detected_at)
    )[0] ?? null;

  const isAbnormal =
    latestFishBehavior?.activity_status === "Abnormal";

  const isNormal =
    latestFishBehavior?.activity_status === "Normal";

  const activityLabel = fishBehaviorError
    ? "Data Unavailable"
    : latestFishBehavior
      ? isAbnormal
        ? "Abnormal Observation"
        : "Normal Observation"
      : "No Observations Yet";

  const activityBadge = fishBehaviorError
    ? "Unavailable"
    : isAbnormal
      ? "Abnormal"
      : isNormal
        ? "Normal"
        : "No Data";

  const activityBadgeStyle = isAbnormal
    ? "bg-amber-100 text-amber-700"
    : isNormal
      ? "bg-emerald-100 text-emerald-700"
      : "bg-slate-100 text-slate-600";

  // ======================================================
  // EQUIPMENT SUMMARY
  // ======================================================

  const equipmentItems: EquipmentItem[] = [
    {
      name: "Aerator",
      description:
        "Automatic aeration simulation available; physical hardware not connected",
    },
    {
      name: "Water Pump",
      description:
        "Water pump hardware not connected",
    },
    {
      name: "Inlet Valve",
      description:
        "Inlet valve hardware not connected",
    },
    {
      name: "Outlet Valve",
      description:
        "Outlet valve hardware not connected",
    },
    {
      name: "Automatic Feeder",
      description:
        "Physical feeder not yet connected",
    },
  ];

  // ======================================================
  // ALERT SUMMARY
  // ======================================================

  const unacknowledgedAlerts = alerts
    .filter(
      (alert) =>
        alert.acknowledged === false ||
        alert.acknowledged === 0
    )
    .sort(
      (a, b) =>
        getTimestamp(b.created_at) -
        getTimestamp(a.created_at)
    );

  const latestAlert =
    unacknowledgedAlerts[0] ?? null;

  // ======================================================
  // FEEDING SUMMARY
  // ======================================================

  const enabledSchedules = feedingSchedules.filter(
    (schedule) =>
      schedule.enabled === true ||
      schedule.enabled === 1
  );

  const scheduledTimes = [
    ...new Set(
      enabledSchedules
        .map((schedule) => schedule.feeding_time)
        .filter(Boolean)
    ),
  ].sort();

  const lastFeeding =
    [...feedingHistory]
      .filter((record) => record.status === "Completed")
      .sort(
        (a, b) =>
          getTimestamp(b.fed_at) -
          getTimestamp(a.fed_at)
      )[0] ?? null;

  // ======================================================
  // RENDER DASHBOARD
  // ======================================================

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <Header />

        <div className="flex-1 bg-slate-50 p-4 sm:p-6 lg:p-8">
          {/* =========================
              WATER QUALITY OVERVIEW
          ========================== */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Water Quality Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Latest recorded fishpond water conditions
            </p>

            <p className="mt-2 text-xs font-medium text-amber-700">
              Prototype data — physical sensor integration
              is not yet active.
            </p>
          </div>

          {/* OVERALL WATER QUALITY STATUS */}

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Overall Water Quality Status
              </p>

              <h3 className="mt-1 text-lg font-semibold text-slate-900">
                {overallWaterStatus === "Normal"
                  ? "Within Configured Ranges"
                  : overallWaterStatus === "Warning"
                    ? "Parameter Warning"
                    : overallWaterStatus === "No Data"
                      ? "Insufficient Data"
                      : overallWaterStatus === "Unconfigured"
                        ? "Threshold Not Configured"
                        : "Data Unavailable"}
              </h3>

              <p className="mt-2 text-xs text-slate-500">
                Evaluated using saved MySQL thresholds.
                Prototype readings only.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${overallWaterStyle.dot}`}
              />

              <span
                className={`text-sm font-semibold ${overallWaterStyle.text}`}
              >
                {overallWaterStatus}
              </span>
            </div>
          </div>

          {(waterQualityError || settingsError) && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {waterQualityError &&
                "Water quality readings could not be loaded. "}

              {settingsError &&
                "Saved monitoring thresholds could not be loaded."}
            </div>
          )}

          {/* WATER QUALITY CARDS */}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {waterParameters.map((parameter) => {
              const styles = getStatusStyle(
                parameter.status
              );

              return (
                <div
                  key={parameter.key}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <p className="text-sm font-medium text-slate-500">
                    {parameter.title}
                  </p>

                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-3xl font-bold text-slate-900">
                      {displayValue(parameter.value)}
                    </span>

                    <span className="mb-1 text-sm text-slate-500">
                      {parameter.range?.unit ?? ""}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${styles.dot}`}
                    />

                    <span
                      className={`text-sm font-medium ${styles.text}`}
                    >
                      {waterQualityError || settingsError
                        ? "Unavailable"
                        : parameter.status === "No Data"
                          ? "No Reading"
                          : parameter.status}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Prototype reading
                  </p>
                </div>
              );
            })}
          </div>

          {/* POND MONITORING */}

          <section className="mt-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Pond Monitoring
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Fish camera and behavior observation
                overview
              </p>
            </div>

            {/* CAMERA PREVIEW */}

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex h-72 items-center justify-center bg-slate-900">
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-300">
                    Live Camera Feed
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    OV7670 camera preview will appear
                    here after compatible hardware
                    integration.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    OV7670 Camera
                  </p>

                  <p className="text-xs text-slate-500">
                    Pond Camera
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />

                  <span className="text-sm font-medium text-slate-500">
                    Not Connected
                  </span>
                </div>
              </div>
            </div>

            {/* FISH ACTIVITY STATUS */}

            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Fish Activity Status
                  </p>

                  <h3 className="mt-1 text-lg font-semibold text-slate-900">
                    {activityLabel}
                  </h3>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${activityBadgeStyle}`}
                >
                  {activityBadge}
                </span>
              </div>

              {latestFishBehavior && !fishBehaviorError ? (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">
                      Latest Behavior:
                    </span>{" "}
                    {latestFishBehavior.behavior_type ??
                      "Unspecified"}
                  </p>

                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">
                      Fish:
                    </span>{" "}
                    {latestFishBehavior.fish_name ??
                      "Unknown Fish"}
                  </p>

                  {latestFishBehavior.description && (
                    <p className="text-sm text-slate-500">
                      {latestFishBehavior.description}
                    </p>
                  )}

                  <p className="text-xs text-slate-500">
                    Observation Date:{" "}
                    {formatDateTime(
                      latestFishBehavior.detected_at
                    )}
                  </p>

                  <p className="text-xs font-medium text-amber-700">
                    Source:{" "}
                    {latestFishBehavior.detection_source ??
                      "Unspecified"}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  {fishBehaviorError
                    ? "Unable to retrieve fish behavior records."
                    : "No fish behavior observations have been recorded."}
                </p>
              )}

              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500">
                  Automatic camera-based behavior
                  detection is not yet active. Recorded
                  manual observations do not confirm
                  the current condition of every fish.
                </p>
              </div>
            </div>
          </section>


{/* EQUIPMENT STATUS */}

<section className="mt-8">
  <div className="mb-6">
    <h2 className="text-lg font-semibold text-slate-900">
      Equipment Status
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      Pond equipment and automation readiness
    </p>

    <p className="mt-2 text-xs font-medium text-amber-700">
      Prototype controls only — physical equipment status
      is not yet available.
    </p>
  </div>

  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
    {equipmentItems.map((equipment) => (
      <div
        key={equipment.name}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {/* EQUIPMENT NAME AND HARDWARE STATUS */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">
              {equipment.name}
            </p>

            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              Not Connected
            </h3>
          </div>

          <span className="h-3 w-3 shrink-0 rounded-full bg-slate-400" />
        </div>

        {/* EQUIPMENT DESCRIPTION */}
        <p className="mt-4 text-sm text-slate-500">
          {equipment.description}
        </p>

        {/* AUTOMATIC AERATION REQUEST */}
        {equipment.name === "Aerator" && (
          <div className="mt-4 rounded-lg border border-cyan-100 bg-cyan-50 p-3">
            <p className="text-xs font-medium text-slate-600">
              Automatic Aeration Request
            </p>

            <p className="mt-1 text-sm font-semibold text-cyan-800">
              {automaticAerationError
                ? "Unavailable"
                : automaticAeration?.requested_state != null
                  ? `${automaticAeration.requested_state} (Simulation)`
                  : "Unavailable"}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Simulated automatic request only.
              Physical aerator hardware is not connected.
            </p>
          </div>
        )}

        {/* HARDWARE INTEGRATION STATUS */}
        <p className="mt-3 text-xs font-medium text-amber-700">
          Hardware Integration Pending
        </p>
      </div>
    ))}
  </div>
</section>


          {/* RECENT ALERTS */}

          <section className="mt-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Alerts
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest unacknowledged system notifications
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              {alertsError ? (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Alerts Unavailable
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Unable to retrieve alert records
                    from the backend.
                  </p>
                </div>
              ) : latestAlert ? (
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {latestAlert.title}
                    </h3>

                    <p className="mt-2 text-sm text-slate-600">
                      {latestAlert.message}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      {formatDateTime(
                        latestAlert.created_at
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {unacknowledgedAlerts.length}{" "}
                      unacknowledged alert(s)
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      latestAlert.severity === "Critical"
                        ? "bg-red-100 text-red-700"
                        : latestAlert.severity === "Warning"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-sky-100 text-sky-700"
                    }`}
                  >
                    {latestAlert.severity}
                  </span>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    No Unacknowledged Alerts
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    No unacknowledged alerts are
                    currently stored in the database.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* FEEDING SUMMARY */}

          <section className="mt-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Feeding Summary
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Configured feeding schedule and
                recorded history
              </p>

              <p className="mt-2 text-xs font-medium text-amber-700">
                Feeding data is from the prototype
                system. Physical feeder integration
                is pending.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* CONFIGURED FEEDING TIMES */}

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Configured Feeding Times
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {feedingError ? (
                    <span className="text-sm text-slate-500">
                      Data Unavailable
                    </span>
                  ) : scheduledTimes.length > 0 ? (
                    scheduledTimes.map((time) => (
                      <span
                        key={time}
                        className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700"
                      >
                        {formatTime(time)}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">
                      Not Scheduled
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm font-medium text-cyan-600">
                  {feedingError
                    ? "Data Unavailable"
                    : "Saved Schedule"}
                </p>
              </div>

              {/* LAST RECORDED FEEDING */}

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Last Recorded Feeding
                </p>

                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {feedingError
                    ? "--"
                    : lastFeeding
                      ? formatDateTime(
                          lastFeeding.fed_at
                        )
                      : "No Records"}
                </h3>

                <p className="mt-2 text-sm font-medium text-slate-500">
                  {feedingError
                    ? "Data Unavailable"
                    : lastFeeding
                      ? `${lastFeeding.trigger_type} — Prototype Record`
                      : "No completed feeding recorded"}
                </p>
              </div>
            </div>
          </section>

          {/* SYSTEM SUMMARY */}

          <section className="mt-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                System Summary
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current SMART Aqua Pond development status
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Overall System
                  </p>

                  <h3 className="mt-1 text-xl font-semibold text-slate-900">
                    Prototype Mode
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Dashboard, database, and manual fish
                    observations are under software
                    testing. Sensor, camera, and physical
                    equipment integration are still pending.
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2 rounded-full bg-amber-100 px-4 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />

                  <span className="text-sm font-medium text-amber-700">
                    Prototype
                  </span>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500">
                  Controller: Arduino UNO R4 Minima
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Planned Camera: OV7670
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Fish Profiles: 2 Koi and 1 Goldfish
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Monitoring Threshold Source: MySQL Settings
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
