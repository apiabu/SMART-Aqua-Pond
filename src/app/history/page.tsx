"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  getWaterQualityReadings,
  type WaterQualityReading,
} from "@/lib/api";
import {
  History,
  Search,
  Download,
  Thermometer,
  Activity,
  Waves,
  Database,
} from "lucide-react";

type HistoryRecord = {
  id: string;
  parameter: string;
  value: number;
  unit: string;
  status: string;
  timestamp: string;
};

const parameterOptions = [
  "All Parameters",
  "Water Temperature",
  "pH Level",
  "Dissolved Oxygen",
  "Turbidity",
  "Water Level",
];

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatus(
  parameter: string,
  value: number
): string {
  switch (parameter) {
    case "Water Temperature":
      return value >= 25 && value <= 30 ? "Normal" : "Warning";

    case "pH Level":
      return value >= 6.5 && value <= 8.5 ? "Normal" : "Warning";

    case "Dissolved Oxygen":
      return value >= 5 ? "Normal" : "Warning";

    case "Turbidity":
      return value <= 5 ? "Normal" : "Warning";

    case "Water Level":
      return value >= 70 ? "Normal" : "Warning";

    default:
      return "Normal";
  }
}

function convertReadingToHistoryRecords(
  reading: WaterQualityReading
): HistoryRecord[] {
  const records: HistoryRecord[] = [];

  if (reading.temperature !== null) {
    const value = Number(reading.temperature);

    records.push({
      id: `${reading.id}-temperature`,
      parameter: "Water Temperature",
      value,
      unit: "°C",
      status: getStatus("Water Temperature", value),
      timestamp: reading.recorded_at,
    });
  }

  if (reading.ph_level !== null) {
    const value = Number(reading.ph_level);

    records.push({
      id: `${reading.id}-ph`,
      parameter: "pH Level",
      value,
      unit: "pH",
      status: getStatus("pH Level", value),
      timestamp: reading.recorded_at,
    });
  }

  if (reading.dissolved_oxygen !== null) {
    const value = Number(reading.dissolved_oxygen);

    records.push({
      id: `${reading.id}-oxygen`,
      parameter: "Dissolved Oxygen",
      value,
      unit: "mg/L",
      status: getStatus("Dissolved Oxygen", value),
      timestamp: reading.recorded_at,
    });
  }

  if (reading.turbidity !== null) {
    const value = Number(reading.turbidity);

    records.push({
      id: `${reading.id}-turbidity`,
      parameter: "Turbidity",
      value,
      unit: "NTU",
      status: getStatus("Turbidity", value),
      timestamp: reading.recorded_at,
    });
  }

  if (reading.water_level !== null) {
    const value = Number(reading.water_level);

    records.push({
      id: `${reading.id}-water-level`,
      parameter: "Water Level",
      value,
      unit: "%",
      status: getStatus("Water Level", value),
      timestamp: reading.recorded_at,
    });
  }

  return records;
}

export default function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [search, setSearch] = useState("");
  const [selectedParameter, setSelectedParameter] =
    useState("All Parameters");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        setLoading(true);
        setLoadError("");

        const readings = await getWaterQualityReadings();

        if (cancelled) {
          return;
        }

        const historyRecords = readings.flatMap(
          convertReadingToHistoryRecords
        );

        setRecords(historyRecords);
      } catch (error) {
        console.error("Failed to load monitoring history:", error);

        if (!cancelled) {
          setRecords([]);
          setLoadError(
            "Unable to load monitoring history from the database."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch =
        record.parameter.toLowerCase().includes(query) ||
        record.status.toLowerCase().includes(query) ||
        String(record.value).includes(query);

      const matchesParameter =
        selectedParameter === "All Parameters" ||
        record.parameter === selectedParameter;

      const recordDate = record.timestamp.slice(0, 10);

      const matchesStartDate =
        !startDate || recordDate >= startDate;

      const matchesEndDate =
        !endDate || recordDate <= endDate;

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

  const latestTemperature = records.find(
    (record) => record.parameter === "Water Temperature"
  );

  const latestDissolvedOxygen = records.find(
    (record) => record.parameter === "Dissolved Oxygen"
  );

  const latestWaterLevel = records.find(
    (record) => record.parameter === "Water Level"
  );

  function exportCSV() {
    const escapeCSV = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const header = [
      "ID",
      "Parameter",
      "Value",
      "Unit",
      "Status",
      "Timestamp",
    ];

    const rows = filteredRecords.map((record) => [
      record.id,
      record.parameter,
      record.value,
      record.unit,
      record.status,
      formatTimestamp(record.timestamp),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "aqua-pond-history.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  function clearFilters() {
    setSearch("");
    setSelectedParameter("All Parameters");
    setStartDate("");
    setEndDate("");
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
                Monitoring History
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Review and export historical fishpond monitoring readings.
              </p>
            </div>

            <span className="w-fit rounded-full bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700">
              Database Records
            </span>
          </div>

          {/* Database Notice */}
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
            <Database
              size={21}
              className="mt-0.5 shrink-0 text-cyan-700"
            />

            <div>
              <h2 className="text-sm font-semibold text-cyan-900">
                MySQL monitoring history
              </h2>

              <p className="mt-1 text-sm leading-6 text-cyan-800">
                Water-quality records displayed on this page are retrieved
                from the SMART Aqua Pond MySQL database through the Express
                API. Current database entries are prototype test data until
                the Arduino sensors are integrated.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {loadError && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">
                {loadError}
              </p>

              <p className="mt-1 text-xs text-red-600">
                Make sure the Express backend and MySQL server are running.
              </p>
            </div>
          )}

          {/* Summary Cards */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Total Records
                </p>

                <History size={20} className="text-cyan-600" />
              </div>

              <p className="mt-3 text-3xl font-bold text-slate-900">
                {loading ? "--" : filteredRecords.length}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Matching current filters
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Temperature
                </p>

                <Thermometer
                  size={20}
                  className="text-orange-500"
                />
              </div>

              <p className="mt-3 text-3xl font-bold text-slate-900">
                {loading
                  ? "--"
                  : latestTemperature?.value ?? "--"}

                <span className="ml-1 text-base font-medium text-slate-500">
                  °C
                </span>
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Latest database reading
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Dissolved Oxygen
                </p>

                <Activity
                  size={20}
                  className="text-emerald-600"
                />
              </div>

              <p className="mt-3 text-3xl font-bold text-slate-900">
                {loading
                  ? "--"
                  : latestDissolvedOxygen?.value ?? "--"}

                <span className="ml-1 text-base font-medium text-slate-500">
                  mg/L
                </span>
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Latest database reading
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Water Level
                </p>

                <Waves
                  size={20}
                  className="text-blue-600"
                />
              </div>

              <p className="mt-3 text-3xl font-bold text-slate-900">
                {loading
                  ? "--"
                  : latestWaterLevel?.value ?? "--"}

                <span className="ml-1 text-base font-medium text-slate-500">
                  %
                </span>
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Latest database reading
              </p>
            </div>
          </div>

          {/* History Table */}
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Water Quality Records
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Search, filter, and export recorded readings.
                </p>
              </div>

              <button
                type="button"
                onClick={exportCSV}
                disabled={
                  loading || filteredRecords.length === 0
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Download size={17} />
                Export CSV
              </button>
            </div>

            {/* Filters */}
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

            <div className="mt-4 flex items-center justify-between">
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

            {/* Responsive Table */}
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
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {record.status}
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

            <p className="mt-5 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-400">
              Records are retrieved from MySQL through the SMART Aqua Pond
              Express API. Until Arduino Mega sensor integration is completed,
              stored readings should be treated as prototype test data.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}