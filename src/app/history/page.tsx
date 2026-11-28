
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ElementType } from "react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

import {
  getWaterQualityReadings,
  getSystemSettings,
  getWaterQualityRanges,
  getWaterQualityStatus,
  getWaterChangeHistory,
  type WaterQualityReading,
  type WaterQualityParameter,
  type WaterQualityRanges,
  type WaterQualityStatus,
  type WaterChangeHistoryRecord,
} from "@/lib/api";

import {
  History,
  Search,
  Download,
  RefreshCw,
  Thermometer,
  Activity,
  Waves,
  Database,
  Droplets,
  CheckCircle2,
  XCircle,
  Clock3,
} from "lucide-react";

// ======================================================
// TYPES
// ======================================================

type HistoryRecord = {
  id: string;
  parameter: string;
  value: number;
  unit: string;
  status: WaterQualityStatus;
  timestamp: string;
};

type SummaryCardProps = {
  title: string;
  value: string | number;
  unit?: string;
  subtitle: string;
  icon: ElementType;
  iconClassName: string;
};

// ======================================================
// PARAMETER CONFIGURATION
// ======================================================

const parameterOptions = [
  "All Parameters",
  "Water Temperature",
  "pH Level",
  "Total Dissolved Solids (TDS)",
  "Turbidity",
  "Water Level",
];

const parameterDefinitions: {
  key: WaterQualityParameter;
  title: string;
}[] = [
  { key: "temperature", title: "Water Temperature" },
  { key: "ph_level", title: "pH Level" },
  { key: "tds_ppm", title: "Total Dissolved Solids (TDS)" },
  { key: "turbidity", title: "Turbidity" },
  { key: "water_level", title: "Water Level" },
];

// ======================================================
// DATE AND TIME HELPERS
// ======================================================

const PH_TIME_ZONE = "Asia/Manila";

function getTimestampValue(
  timestamp: string | null
): number {
  if (!timestamp) return 0;

  const value = new Date(timestamp).getTime();

  return Number.isFinite(value) ? value : 0;
}

function formatTimestamp(
  timestamp: string | null
): string {
  if (!timestamp) return "—";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Invalid Date";
  }

  return date.toLocaleString("en-PH", {
    timeZone: PH_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getPhilippineDate(
  timestamp: string | null
): string {
  if (!timestamp) return "";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PH_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find(
    (part) => part.type === "year"
  )?.value;

  const month = parts.find(
    (part) => part.type === "month"
  )?.value;

  const day = parts.find(
    (part) => part.type === "day"
  )?.value;

  return year && month && day
    ? `${year}-${month}-${day}`
    : "";
}

// ======================================================
// NUMERIC VALIDATION
// ======================================================

function parseValidNumber(
  value: number | string | null | undefined
): number | null {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : null;
}

function formatNumber(
  value: number | string | null | undefined,
  digits = 2
): string {
  const number = parseValidNumber(value);

  if (number === null) return "—";

  return number.toLocaleString("en-PH", {
    maximumFractionDigits: digits,
  });
}

// ======================================================
// CONVERT MYSQL READINGS TO HISTORY RECORDS
// ======================================================

function convertReadingToHistoryRecords(
  reading: WaterQualityReading,
  ranges: WaterQualityRanges | null
): HistoryRecord[] {
  const records: HistoryRecord[] = [];

  for (const definition of parameterDefinitions) {
    const rawValue = reading[definition.key];
    const numericValue = parseValidNumber(rawValue);

    if (numericValue === null) {
      continue;
    }

    const range = ranges?.[definition.key] ?? null;

    records.push({
      id: `${reading.id}-${definition.key}`,
      parameter: definition.title,
      value: numericValue,
      unit:
        range?.unit ??
        ({
          temperature: "°C",
          ph_level: "pH",
          tds_ppm: "ppm",
          turbidity: "NTU",
          water_level: "%",
        }[definition.key]),
      status: range
        ? getWaterQualityStatus(numericValue, range)
        : "No Data",
      timestamp: reading.recorded_at,
    });
  }

  return records;
}

function buildHistoryRecords(
  readings: WaterQualityReading[],
  ranges: WaterQualityRanges | null
): HistoryRecord[] {
  return readings
    .flatMap((reading) =>
      convertReadingToHistoryRecords(reading, ranges)
    )
    .sort(
      (a, b) =>
        getTimestampValue(b.timestamp) -
        getTimestampValue(a.timestamp)
    );
}

// ======================================================
// SUMMARY CARD
// ======================================================

function SummaryCard({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  iconClassName,
}: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {title}
        </p>

        <Icon
          size={20}
          className={iconClassName}
        />
      </div>

      <p className="mt-3 text-3xl font-bold text-slate-900">
        {value}

        {unit && (
          <span className="ml-1 text-base font-medium text-slate-500">
            {unit}
          </span>
        )}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {subtitle}
      </p>
    </div>
  );
}

// ======================================================
// WATER-CHANGE STATUS BADGE
// ======================================================

function WaterChangeStatusBadge({
  status,
}: {
  status: WaterChangeHistoryRecord["cycle_status"];
}) {
  const styles = {
    Requested:
      "bg-blue-50 text-blue-700",
    Completed:
      "bg-emerald-50 text-emerald-700",
    Cancelled:
      "bg-rose-50 text-rose-700",
  };

  const Icon =
    status === "Completed"
      ? CheckCircle2
      : status === "Cancelled"
        ? XCircle
        : Clock3;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      <Icon size={13} />
      {status}
    </span>
  );
}

// ======================================================
// CSV HELPER
// ======================================================

function escapeCSV(value: string | number): string {
  const text = String(value);

  // Prevent spreadsheet formula injection.
  const safeText = /^[=+\-@\t\r]/.test(text)
    ? `'${text}`
    : text;

  return `"${safeText.replace(/"/g, '""')}"`;
}

function downloadCSV(
  filename: string,
  header: string[],
  rows: (string | number)[][]
) {
  const csv = [header, ...rows]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\r\n");

  const blob = new Blob(
    ["\uFEFF", csv],
    {
      type: "text/csv;charset=utf-8;",
    }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

// ======================================================
// HISTORY PAGE
// ======================================================

export default function HistoryPage() {
  // ====================================================
  // WATER QUALITY STATE
  // ====================================================

  const [readings, setReadings] = useState<
    WaterQualityReading[]
  >([]);

  const [ranges, setRanges] = useState<
    WaterQualityRanges | null
  >(null);

  const [search, setSearch] = useState("");

  const [selectedParameter, setSelectedParameter] =
    useState("All Parameters");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ====================================================
  // WATER-CHANGE HISTORY STATE
  // ====================================================

  const [
    waterChangeHistory,
    setWaterChangeHistory,
  ] = useState<WaterChangeHistoryRecord[]>([]);

  const [
    waterChangeStatusFilter,
    setWaterChangeStatusFilter,
  ] = useState("All Statuses");

  const [
    waterChangeSearch,
    setWaterChangeSearch,
  ] = useState("");

  const [
    waterChangeError,
    setWaterChangeError,
  ] = useState("");

  // ====================================================
  // LOADING AND ERROR STATE
  // ====================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [settingsError, setSettingsError] = useState("");

  // ====================================================
  // INITIAL FETCH
  // ====================================================

  useEffect(() => {
    let cancelled = false;

    async function fetchInitialHistory() {
      const [
        readingsResult,
        settingsResult,
        waterChangeResult,
      ] = await Promise.allSettled([
        getWaterQualityReadings(),
        getSystemSettings(),
        getWaterChangeHistory(),
      ]);

      if (cancelled) return;

      if (readingsResult.status === "fulfilled") {
        setReadings(readingsResult.value);
        setLoadError("");
      } else {
        console.error(
          "Failed to load monitoring history:",
          readingsResult.reason
        );

        setLoadError(
          "Unable to load monitoring history from MySQL."
        );
      }

      if (settingsResult.status === "fulfilled") {
        setRanges(
          getWaterQualityRanges(settingsResult.value)
        );
        setSettingsError("");
      } else {
        console.error(
          "Failed to load system settings:",
          settingsResult.reason
        );

        setRanges(null);

        setSettingsError(
          "Saved thresholds are unavailable. Record statuses cannot be evaluated."
        );
      }

      if (waterChangeResult.status === "fulfilled") {
        setWaterChangeHistory(
          waterChangeResult.value
        );
        setWaterChangeError("");
      } else {
        console.error(
          "Failed to load water-change history:",
          waterChangeResult.reason
        );

        setWaterChangeError(
          "Unable to load automatic water-change history from MySQL."
        );
      }

      setLoading(false);
    }

    void fetchInitialHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  // ====================================================
  // MANUAL REFRESH
  // ====================================================

  const loadHistory = useCallback(async () => {
    setRefreshing(true);

    try {
      const [
        readingsResult,
        settingsResult,
        waterChangeResult,
      ] = await Promise.allSettled([
        getWaterQualityReadings(),
        getSystemSettings(),
        getWaterChangeHistory(),
      ]);

      if (readingsResult.status === "fulfilled") {
        setReadings(readingsResult.value);
        setLoadError("");
      } else {
        console.error(
          "Failed to refresh monitoring history:",
          readingsResult.reason
        );

        setLoadError(
          "Unable to refresh monitoring history from MySQL."
        );
      }

      if (settingsResult.status === "fulfilled") {
        setRanges(
          getWaterQualityRanges(settingsResult.value)
        );
        setSettingsError("");
      } else {
        console.error(
          "Failed to refresh saved thresholds:",
          settingsResult.reason
        );

        setRanges(null);

        setSettingsError(
          "Saved thresholds are unavailable. Record statuses cannot be evaluated."
        );
      }

      if (waterChangeResult.status === "fulfilled") {
        setWaterChangeHistory(
          waterChangeResult.value
        );
        setWaterChangeError("");
      } else {
        console.error(
          "Failed to refresh water-change history:",
          waterChangeResult.reason
        );

        setWaterChangeError(
          "Unable to refresh automatic water-change history."
        );
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  // ====================================================
  // WATER QUALITY RECORDS
  // ====================================================

  const records = useMemo(
    () => buildHistoryRecords(readings, ranges),
    [readings, ranges]
  );

  // ====================================================
  // FILTER WATER QUALITY RECORDS
  // ====================================================

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch =
        !query ||
        record.parameter.toLowerCase().includes(query) ||
        record.status.toLowerCase().includes(query) ||
        String(record.value).includes(query);

      const matchesParameter =
        selectedParameter === "All Parameters" ||
        record.parameter === selectedParameter;

      const recordDate = getPhilippineDate(
        record.timestamp
      );

      const matchesStartDate =
        !startDate ||
        (recordDate !== "" &&
          recordDate >= startDate);

      const matchesEndDate =
        !endDate ||
        (recordDate !== "" &&
          recordDate <= endDate);

      return (
        matchesSearch &&
        matchesParameter &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [
    records,
    search,
    selectedParameter,
    startDate,
    endDate,
  ]);

  // ====================================================
  // FILTER WATER-CHANGE HISTORY
  // ====================================================

  const filteredWaterChangeHistory = useMemo(() => {
    const query = waterChangeSearch
      .trim()
      .toLowerCase();

    return waterChangeHistory
      .filter((record) => {
        const matchesStatus =
          waterChangeStatusFilter === "All Statuses" ||
          record.cycle_status ===
            waterChangeStatusFilter;

        const matchesSearch =
          !query ||
          String(record.id).includes(query) ||
          record.cycle_status
            .toLowerCase()
            .includes(query) ||
          (record.trigger_parameter ?? "")
            .toLowerCase()
            .includes(query) ||
          String(record.target_percentage)
            .includes(query) ||
          String(record.trigger_value ?? "")
            .includes(query);

        return matchesStatus && matchesSearch;
      })
      .sort(
        (a, b) =>
          getTimestampValue(b.created_at) -
          getTimestampValue(a.created_at)
      );
  }, [
    waterChangeHistory,
    waterChangeStatusFilter,
    waterChangeSearch,
  ]);

  // ====================================================
  // LATEST WATER QUALITY READINGS
  // ====================================================

  const latestTemperature = records.find(
    (record) =>
      record.parameter === "Water Temperature"
  );

  const latestTds = records.find(
    (record) =>
      record.parameter === "Total Dissolved Solids (TDS)"
  );

  const latestWaterLevel = records.find(
    (record) =>
      record.parameter === "Water Level"
  );

  // ====================================================
  // WATER-CHANGE SUMMARY COUNTS
  // ====================================================

  const totalWaterChangeCycles =
    waterChangeHistory.length;

  const completedWaterChangeCycles =
    waterChangeHistory.filter(
      (record) => record.cycle_status === "Completed"
    ).length;

  const cancelledWaterChangeCycles =
    waterChangeHistory.filter(
      (record) => record.cycle_status === "Cancelled"
    ).length;

  const requestedWaterChangeCycles =
    waterChangeHistory.filter(
      (record) => record.cycle_status === "Requested"
    ).length;

  // ====================================================
  // WATER QUALITY CSV EXPORT
  // ====================================================

  function exportCSV() {
    if (
      filteredRecords.length === 0 ||
      !ranges
    ) {
      return;
    }

    const header = [
      "ID",
      "Parameter",
      "Value",
      "Unit",
      "Status",
      "Timestamp (Asia/Manila)",
    ];

    const rows = filteredRecords.map((record) => [
      record.id,
      record.parameter,
      record.value,
      record.unit,
      record.status,
      formatTimestamp(record.timestamp),
    ]);

    downloadCSV(
      "smart-aqua-pond-water-quality-history.csv",
      header,
      rows
    );
  }

  // ====================================================
  // WATER-CHANGE CSV EXPORT
  // ====================================================

  function exportWaterChangeCSV() {
    if (filteredWaterChangeHistory.length === 0) {
      return;
    }

    const header = [
      "Cycle ID",
      "Status",
      "Target Percentage",
      "Trigger Parameter",
      "Trigger Value",
      "Started At (Asia/Manila)",
      "Completed At (Asia/Manila)",
      "Cancelled At (Asia/Manila)",
      "Created At (Asia/Manila)",
      "Updated At (Asia/Manila)",
    ];

    const rows = filteredWaterChangeHistory.map(
      (record) => [
        record.id,
        record.cycle_status,
        record.target_percentage,
        record.trigger_parameter ?? "",
        record.trigger_value ?? "",
        formatTimestamp(record.started_at),
        formatTimestamp(record.completed_at),
        formatTimestamp(record.cancelled_at),
        formatTimestamp(record.created_at),
        formatTimestamp(record.updated_at),
      ]
    );

    downloadCSV(
      "smart-aqua-pond-water-change-history.csv",
      header,
      rows
    );
  }

  // ====================================================
  // CLEAR FILTERS
  // ====================================================

  function clearFilters() {
    setSearch("");
    setSelectedParameter("All Parameters");
    setStartDate("");
    setEndDate("");
  }

  function clearWaterChangeFilters() {
    setWaterChangeSearch("");
    setWaterChangeStatusFilter("All Statuses");
  }

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <Header />

        <div className="flex-1 p-5 sm:p-8">
          {/* PAGE HEADER */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Monitoring History
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Review and export historical fishpond
                monitoring and automatic water-change
                records.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700">
                Database Records
              </span>

              <button
                type="button"
                onClick={() => void loadHistory()}
                disabled={loading || refreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing ? "animate-spin" : ""
                  }
                />

                {refreshing
                  ? "Refreshing..."
                  : "Refresh Records"}
              </button>
            </div>
          </div>

          {/* DATABASE NOTICE */}

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
            <Database
              size={21}
              className="mt-0.5 shrink-0 text-cyan-700"
            />

            <div>
              <h2 className="text-sm font-semibold text-cyan-900">
                MySQL Monitoring History
              </h2>

              <p className="mt-1 text-sm leading-6 text-cyan-800">
                Water-quality and automatic water-change
                records are retrieved from MySQL through
                the SMART Aqua Pond Express API.
                Normal and Warning statuses are calculated
                using currently saved monitoring thresholds.
              </p>

              <p className="mt-2 text-xs font-medium text-cyan-700">
                Controller: Arduino UNO R4 Minima —
                hardware integration pending.
              </p>

              <p className="mt-2 text-xs text-cyan-700">
                Historical water-quality statuses are
                recalculated using current settings,
                not thresholds saved at the time of
                each reading. Water-change cycles
                currently represent backend simulations,
                not physical pump or valve operations.
              </p>
            </div>
          </div>

          {/* WATER QUALITY ERRORS */}

          {loadError && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">
                {loadError}
              </p>
            </div>
          )}

          {settingsError && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-700">
                {settingsError}
              </p>
            </div>
          )}

          {/* SUMMARY CARDS */}

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Total Records"
              value={
                loading
                  ? "--"
                  : filteredRecords.length
              }
              subtitle="Matching current filters"
              icon={History}
              iconClassName="text-cyan-600"
            />

            <SummaryCard
              title="Temperature"
              value={
                loading
                  ? "--"
                  : latestTemperature?.value ?? "--"
              }
              unit="°C"
              subtitle="Latest database reading"
              icon={Thermometer}
              iconClassName="text-orange-500"
            />

            <SummaryCard
              title="Total Dissolved Solids (TDS)"
              value={
                loading
                  ? "--"
                  : latestTds?.value ?? "--"
              }
              unit="ppm"
              subtitle="Latest database reading"
              icon={Activity}
              iconClassName="text-emerald-600"
            />

            <SummaryCard
              title="Water Level"
              value={
                loading
                  ? "--"
                  : latestWaterLevel?.value ?? "--"
              }
              unit="%"
              subtitle="Latest database reading"
              icon={Waves}
              iconClassName="text-blue-600"
            />
          </div>

          {/* ============================================
              WATER QUALITY HISTORY SECTION
          ============================================ */}

          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Water Quality Records
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Search, filter, and export recorded
                  readings.
                </p>
              </div>

              <button
                type="button"
                onClick={exportCSV}
                disabled={
                  loading ||
                  refreshing ||
                  !ranges ||
                  filteredRecords.length === 0
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Download size={17} />
                Export CSV
              </button>
            </div>

            {/* WATER QUALITY FILTERS */}

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search records..."
                  aria-label="Search monitoring records"
                  className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <select
                value={selectedParameter}
                onChange={(event) =>
                  setSelectedParameter(event.target.value)
                }
                aria-label="Filter by parameter"
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500"
              >
                {parameterOptions.map((parameter) => (
                  <option
                    key={parameter}
                    value={parameter}
                  >
                    {parameter}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) =>
                  setStartDate(event.target.value)
                }
                aria-label="Start date"
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-500"
              />

              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) =>
                  setEndDate(event.target.value)
                }
                aria-label="End date"
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-500"
              />
            </div>

            {/* WATER QUALITY RECORD COUNT */}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                {loading
                  ? "Loading database records..."
                  : `Showing ${filteredRecords.length} of ${records.length} records`}
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-cyan-700 hover:text-cyan-900"
              >
                Clear filters
              </button>
            </div>

            {/* WATER QUALITY TABLE */}

            <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Parameter
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Value
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Status
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Date and Time
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-12 text-center text-slate-500"
                      >
                        Loading monitoring history...
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    filteredRecords.map((record) => (
                      <tr
                        key={record.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 font-medium text-slate-800">
                          {record.parameter}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {record.value} {record.unit}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              record.status === "Normal"
                                ? "bg-emerald-50 text-emerald-700"
                                : record.status === "Warning"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {record.status === "No Data"
                              ? "Unavailable"
                              : record.status}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                          {formatTimestamp(
                            record.timestamp
                          )}
                        </td>
                      </tr>
                    ))}

                  {!loading &&
                    filteredRecords.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-5 py-12 text-center text-slate-500"
                        >
                          {loadError
                            ? "Monitoring history could not be loaded."
                            : "No records match your filters."}
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>

            {/* WATER QUALITY FOOTER */}

            <p className="mt-5 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-400">
              Records are retrieved from MySQL through
              the SMART Aqua Pond Express API.
              Until Arduino UNO R4 Minima sensor
              integration is completed, stored readings
              should be treated as prototype test data.
              Normal and Warning statuses use the
              currently configured MySQL thresholds.
            </p>
          </div>

          {/* ============================================
              AUTOMATIC WATER-CHANGE HISTORY SECTION
          ============================================ */}

          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            {/* SECTION HEADER */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-cyan-50 p-3">
                  <Droplets
                    size={22}
                    className="text-cyan-600"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Automatic Water-Change History
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Track automatic partial water-change
                    requests, completions, and cancellations.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={exportWaterChangeCSV}
                disabled={
                  loading ||
                  refreshing ||
                  filteredWaterChangeHistory.length === 0
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Download size={17} />
                Export CSV
              </button>
            </div>

            {/* SIMULATION NOTICE */}

            <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-xs leading-5 text-blue-700">
                These records represent backend-simulated
                automatic water-change cycles. A Completed
                status indicates that the simulation was
                marked complete; it does not confirm that
                physical water was drained or refilled.
              </p>
            </div>

            {/* WATER-CHANGE ERROR */}

            {waterChangeError && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-700">
                  {waterChangeError}
                </p>
              </div>
            )}

            {/* WATER-CHANGE SUMMARY CARDS */}

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                title="Total Cycles"
                value={
                  loading
                    ? "--"
                    : totalWaterChangeCycles
                }
                subtitle="Saved history records"
                icon={Droplets}
                iconClassName="text-cyan-600"
              />

              <SummaryCard
                title="Completed"
                value={
                  loading
                    ? "--"
                    : completedWaterChangeCycles
                }
                subtitle="Completed simulations"
                icon={CheckCircle2}
                iconClassName="text-emerald-600"
              />

              <SummaryCard
                title="Cancelled"
                value={
                  loading
                    ? "--"
                    : cancelledWaterChangeCycles
                }
                subtitle="Cancelled simulations"
                icon={XCircle}
                iconClassName="text-rose-600"
              />

              <SummaryCard
                title="Requested"
                value={
                  loading
                    ? "--"
                    : requestedWaterChangeCycles
                }
                subtitle="Pending cycle requests"
                icon={Clock3}
                iconClassName="text-blue-600"
              />
            </div>

            {/* WATER-CHANGE FILTERS */}

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={waterChangeSearch}
                  onChange={(event) =>
                    setWaterChangeSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search water-change cycles..."
                  aria-label="Search water-change history"
                  className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <select
                value={waterChangeStatusFilter}
                onChange={(event) =>
                  setWaterChangeStatusFilter(
                    event.target.value
                  )
                }
                aria-label="Filter water-change status"
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500"
              >
                <option value="All Statuses">
                  All Statuses
                </option>

                <option value="Requested">
                  Requested
                </option>

                <option value="Completed">
                  Completed
                </option>

                <option value="Cancelled">
                  Cancelled
                </option>
              </select>
            </div>

            {/* WATER-CHANGE RECORD COUNT */}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                {loading
                  ? "Loading water-change history..."
                  : `Showing ${filteredWaterChangeHistory.length} of ${waterChangeHistory.length} cycles`}
              </p>

              <button
                type="button"
                onClick={clearWaterChangeFilters}
                className="text-sm font-medium text-cyan-700 hover:text-cyan-900"
              >
                Clear filters
              </button>
            </div>

            {/* WATER-CHANGE HISTORY TABLE */}

            <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Cycle ID
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Status
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Target
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Trigger
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Trigger Value
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Started At
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Finished At
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-12 text-center text-slate-500"
                      >
                        Loading automatic water-change
                        history...
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    filteredWaterChangeHistory.map(
                      (record) => {
                        const finishedAt =
                          record.cycle_status ===
                          "Completed"
                            ? record.completed_at
                            : record.cycle_status ===
                                "Cancelled"
                              ? record.cancelled_at
                              : null;

                        return (
                          <tr
                            key={record.id}
                            className="hover:bg-slate-50"
                          >
                            <td className="px-5 py-4 font-semibold text-slate-800">
                              #{record.id}
                            </td>

                            <td className="px-5 py-4">
                              <WaterChangeStatusBadge
                                status={
                                  record.cycle_status
                                }
                              />
                            </td>

                            <td className="px-5 py-4 font-medium text-slate-800">
                              {formatNumber(
                                record.target_percentage
                              )}
                              %
                            </td>

                            <td className="px-5 py-4 text-slate-700">
                              {record.trigger_parameter
                                ? record.trigger_parameter
                                    .replace(/_/g, " ")
                                    .replace(
                                      /\b\w/g,
                                      (letter) =>
                                        letter.toUpperCase()
                                    )
                                : "—"}
                            </td>

                            <td className="px-5 py-4 text-slate-700">
                              {formatNumber(
                                record.trigger_value
                              )}

                              {record.trigger_parameter ===
                                "turbidity" &&
                              record.trigger_value !== null
                                ? " NTU"
                                : ""}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                              {formatTimestamp(
                                record.started_at
                              )}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                              {formatTimestamp(
                                finishedAt
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}

                  {!loading &&
                    filteredWaterChangeHistory.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-12 text-center text-slate-500"
                        >
                          {waterChangeError
                            ? "Automatic water-change history could not be loaded."
                            : waterChangeHistory.length === 0
                              ? "No automatic water-change cycles have been recorded yet."
                              : "No water-change cycles match your filters."}
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>

            {/* WATER-CHANGE FOOTER */}

            <p className="mt-5 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-400">
              Automatic water-change records are
              retrieved from the MySQL
              automatic_water_change_history table
              through the Express API. Cycle statuses
              are saved in the database. Physical
              equipment integration with Arduino UNO
              R4 Minima is still pending.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
