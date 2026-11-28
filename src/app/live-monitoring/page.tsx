
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

import {
  getWaterQualityReadings,
  getSystemSettings,
  getWaterQualityRanges,
  getWaterQualityStatus,
  formatWaterQualityRange,
  type WaterQualityReading,
  type WaterQualityRange,
  type WaterQualityStatus,
} from "@/lib/api";

// ======================================================
// STATUS COLORS
// ======================================================

function getStatusStyles(status: WaterQualityStatus) {
  switch (status) {
    case "Normal":
      return {
        dot: "bg-emerald-500",
        text: "text-emerald-600",
      };

    case "Warning":
      return {
        dot: "bg-amber-500",
        text: "text-amber-600",
      };

    default:
      return {
        dot: "bg-slate-400",
        text: "text-slate-500",
      };
  }
}

// ======================================================
// WATER QUALITY CARD
// ======================================================

type WaterQualityCardProps = {
  title: string;
  value: number | string | null | undefined;
  range: WaterQualityRange | null;
};

function WaterQualityCard({
  title,
  value,
  range,
}: WaterQualityCardProps) {
  const status: WaterQualityStatus = range
    ? getWaterQualityStatus(value, range)
    : "No Data";

  const styles = getStatusStyles(status);

  const numericValue =
    value === null ||
    value === undefined ||
    String(value).trim() === ""
      ? null
      : Number(value);

  const displayValue =
    numericValue !== null &&
    Number.isFinite(numericValue)
      ? String(value)
      : "--";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <div className="mt-3 flex items-end gap-2">
        <span className="text-3xl font-bold text-slate-900">
          {displayValue}
        </span>

        <span className="mb-1 text-sm text-slate-500">
          {range?.unit ?? ""}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${styles.dot}`}
        />

        <span
          className={`text-sm font-medium ${styles.text}`}
        >
          {range ? status : "Unavailable"}
        </span>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {range
          ? `Configured prototype range: ${formatWaterQualityRange(range)}`
          : "Configured thresholds unavailable"}
      </p>
    </div>
  );
}

// ======================================================
// LIVE MONITORING PAGE
// ======================================================

export default async function LiveMonitoringPage() {
  let latestReading: WaterQualityReading | null = null;

  let readingsError = false;
  let settingsError = false;

  // ======================================================
  // FETCH WATER READINGS AND SETTINGS
  // ======================================================

  const [readingsResult, settingsResult] =
    await Promise.allSettled([
      getWaterQualityReadings(),
      getSystemSettings(),
    ]);

  if (readingsResult.status === "fulfilled") {
    const readings = readingsResult.value;

    latestReading =
      [...readings].sort(
        (a, b) =>
          new Date(b.recorded_at).getTime() -
          new Date(a.recorded_at).getTime()
      )[0] ?? null;
  } else {
    readingsError = true;

    console.error(
      "Failed to load water quality readings:",
      readingsResult.reason
    );
  }

  let ranges: ReturnType<
    typeof getWaterQualityRanges
  > | null = null;

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

  // ======================================================
  // WATER QUALITY PARAMETER CONFIGURATION
  // ======================================================

  const waterParameters = [
    {
      title: "Water Temperature",
      value: latestReading?.temperature,
      range: ranges?.temperature ?? null,
    },
    {
      title: "pH Level",
      value: latestReading?.ph_level,
      range: ranges?.ph_level ?? null,
    },
    {
      title: "Total Dissolved Solids (TDS)",
      value: latestReading?.tds_ppm,
      range: ranges?.tds_ppm ?? null,
    },
    {
      title: "Turbidity",
      value: latestReading?.turbidity,
      range: ranges?.turbidity ?? null,
    },
    {
      title: "Water Level",
      value: latestReading?.water_level,
      range: ranges?.water_level ?? null,
    },
  ];

  // ======================================================
  // OVERALL WATER QUALITY STATUS
  // ======================================================

  const parameterStatuses: WaterQualityStatus[] =
    waterParameters.map((parameter) =>
      parameter.range
        ? getWaterQualityStatus(
            parameter.value,
            parameter.range
          )
        : "No Data"
    );

  const hasWarning =
    parameterStatuses.includes("Warning");

  const hasMissingData =
    parameterStatuses.includes("No Data");

  const hasUnconfiguredThreshold =
    parameterStatuses.includes("Unconfigured");

  const overallStatus: WaterQualityStatus =
    hasWarning
      ? "Warning"
      : hasMissingData
        ? "No Data"
        : hasUnconfiguredThreshold
          ? "Unconfigured"
          : "Normal";

  const dataUnavailable =
    readingsError || settingsError;

  const overallStyles = getStatusStyles(
    overallStatus
  );

  // ======================================================
  // RENDER PAGE
  // ======================================================

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <Header />

        <div className="flex-1 bg-slate-50 p-5 sm:p-8">
          {/* PAGE HEADER */}

          <h1 className="text-2xl font-bold text-slate-900">
            Live Monitoring
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Latest stored fishpond water quality readings
            from the SMART Aqua Pond database.
          </p>

          {/* MONITORING STATUS */}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />

            <span className="text-sm font-medium text-slate-700">
              Prototype Monitoring
            </span>

            <span className="text-sm text-slate-400">
              • Latest stored reading
            </span>

            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              Prototype Data
            </span>
          </div>

          {/* OVERALL WATER QUALITY SUMMARY */}

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Overall Water Quality Status
                </p>

                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  {dataUnavailable
                    ? "Data Unavailable"
                    : overallStatus === "Normal"
                      ? "Within Configured Ranges"
                      : overallStatus === "Warning"
                        ? "Parameter Warning"
                        : overallStatus === "Unconfigured"
                          ? "Threshold Not Configured"
                          : "Insufficient Data"}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    dataUnavailable
                      ? "bg-slate-400"
                      : overallStyles.dot
                  }`}
                />

                <span
                  className={`text-sm font-medium ${
                    dataUnavailable
                      ? "text-slate-500"
                      : overallStyles.text
                  }`}
                >
                  {dataUnavailable
                    ? "Unavailable"
                    : overallStatus}
                </span>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Status is calculated from saved MySQL
              monitoring thresholds. Readings are
              prototype test data, not verified
              real-time sensor measurements.
            </p>

            {settingsError && (
              <p className="mt-3 text-sm text-amber-700">
                Unable to load saved thresholds.
                Monitoring status cannot be fully
                evaluated.
              </p>
            )}

            {readingsError && (
              <p className="mt-3 text-sm text-amber-700">
                Unable to load water quality readings
                from the database.
              </p>
            )}
          </div>

          {/* WATER QUALITY CARDS */}

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {waterParameters.map((parameter) => (
              <WaterQualityCard
                key={parameter.title}
                title={parameter.title}
                value={parameter.value}
                range={parameter.range}
              />
            ))}
          </div>

          {/* SENSOR CONNECTION STATUS */}

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Sensor Connection
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Arduino UNO R4 Minima water
                  monitoring controller
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />

                <span className="text-sm font-medium text-slate-600">
                  Not Connected
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Current readings are stored prototype
              test data. Physical Arduino sensor
              integration has not yet been completed.
            </p>
          </div>

          {/* MONITORING INFORMATION */}

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              Monitoring Information
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <p className="text-slate-500">
                  Data Source
                </p>

                <p className="mt-1 font-medium text-slate-900">
                  MySQL Database
                </p>
              </div>

              <div>
                <p className="text-slate-500">
                  Monitoring Mode
                </p>

                <p className="mt-1 font-medium text-slate-900">
                  Prototype
                </p>
              </div>

              <div>
                <p className="text-slate-500">
                  Water Quality Parameters
                </p>

                <p className="mt-1 font-medium text-slate-900">
                  5 Parameters
                </p>
              </div>

              <div>
                <p className="text-slate-500">
                  Threshold Source
                </p>

                <p
                  className={`mt-1 font-medium ${
                    settingsError
                      ? "text-amber-700"
                      : "text-emerald-700"
                  }`}
                >
                  {settingsError
                    ? "Unavailable"
                    : "Saved MySQL Settings"}
                </p>
              </div>

              <div>
                <p className="text-slate-500">
                  Hardware Integration
                </p>

                <p className="mt-1 font-medium text-amber-700">
                  Pending
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
