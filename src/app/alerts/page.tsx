"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  getAlerts,
  acknowledgeAlert as acknowledgeAlertApi,
  acknowledgeAllAlerts,
  type AlertRecord as ApiAlertRecord,
  type AlertSeverity,
  type AlertCategory,
} from "@/lib/api";
import {
  TriangleAlert,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Bell,
  Activity,
  Fish,
  Droplets,
  Wind,
  Database,
} from "lucide-react";

type AlertRecord = {
  id: number;
  title: string;
  description: string;
  category: AlertCategory;
  severity: AlertSeverity;
  time: string;
  acknowledged: boolean;
};

type SeverityFilter = "All" | AlertSeverity;
type CategoryFilter = "All" | AlertCategory;

function formatAlertTime(timestamp: string) {
  return new Date(timestamp).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function convertApiAlert(alert: ApiAlertRecord): AlertRecord {
  return {
    id: alert.id,
    title: alert.title,
    description: alert.message,
    category: alert.category,
    severity: alert.severity,
    time: formatAlertTime(alert.created_at),
    acknowledged: Boolean(alert.acknowledged),
  };
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [severityFilter, setSeverityFilter] =
    useState<SeverityFilter>("All");
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>("All");
  const [search, setSearch] = useState("");
  const [showAcknowledged, setShowAcknowledged] = useState(true);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [acknowledgingId, setAcknowledgingId] =
    useState<number | null>(null);
  const [acknowledgingAll, setAcknowledgingAll] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAlerts() {
      try {
        setLoading(true);
        setLoadError("");

        const data = await getAlerts();

        if (cancelled) {
          return;
        }

        setAlerts(data.map(convertApiAlert));
      } catch (error) {
        console.error("Failed to load alerts:", error);

        if (!cancelled) {
          setAlerts([]);
          setLoadError(
            "Unable to load alerts from the database."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAlerts();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredAlerts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return alerts.filter((alert) => {
      const matchesSeverity =
        severityFilter === "All" ||
        alert.severity === severityFilter;

      const matchesCategory =
        categoryFilter === "All" ||
        alert.category === categoryFilter;

      const matchesSearch =
        !query ||
        alert.title.toLowerCase().includes(query) ||
        alert.description.toLowerCase().includes(query);

      const matchesAcknowledged =
        showAcknowledged || !alert.acknowledged;

      return (
        matchesSeverity &&
        matchesCategory &&
        matchesSearch &&
        matchesAcknowledged
      );
    });
  }, [
    alerts,
    severityFilter,
    categoryFilter,
    search,
    showAcknowledged,
  ]);

  const criticalCount = alerts.filter(
    (alert) =>
      alert.severity === "Critical" && !alert.acknowledged
  ).length;

  const warningCount = alerts.filter(
    (alert) =>
      alert.severity === "Warning" && !alert.acknowledged
  ).length;

  const unacknowledgedCount = alerts.filter(
    (alert) => !alert.acknowledged
  ).length;

  async function handleAcknowledgeAlert(id: number) {
    try {
      setActionError("");
      setAcknowledgingId(id);

      await acknowledgeAlertApi(id);

      setAlerts((current) =>
        current.map((alert) =>
          alert.id === id
            ? {
                ...alert,
                acknowledged: true,
              }
            : alert
        )
      );
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);

      setActionError(
        "Unable to acknowledge the alert. Please try again."
      );
    } finally {
      setAcknowledgingId(null);
    }
  }

  async function handleAcknowledgeAll() {
    try {
      setActionError("");
      setAcknowledgingAll(true);

      await acknowledgeAllAlerts();

      setAlerts((current) =>
        current.map((alert) => ({
          ...alert,
          acknowledged: true,
        }))
      );
    } catch (error) {
      console.error("Failed to acknowledge all alerts:", error);

      setActionError(
        "Unable to acknowledge all alerts. Please try again."
      );
    } finally {
      setAcknowledgingAll(false);
    }
  }

  function severityClass(severity: AlertSeverity) {
    switch (severity) {
      case "Critical":
        return "bg-red-50 text-red-700";

      case "Warning":
        return "bg-amber-50 text-amber-700";

      case "Info":
        return "bg-blue-50 text-blue-700";
    }
  }

  function categoryIcon(category: AlertCategory) {
    switch (category) {
      case "Water Quality":
        return Droplets;

      case "Fish Behavior":
        return Fish;

      case "Equipment":
        return Wind;
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <Header />

        <div className="flex-1 bg-slate-50 p-5 sm:p-8">
          {/* Page Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Alerts and Notifications
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Review water quality warnings, fish activity,
                and equipment alerts.
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
                MySQL alert history
              </h2>

              <p className="mt-1 text-sm leading-6 text-cyan-800">
                Alerts displayed on this page are retrieved from
                the SMART Aqua Pond MySQL database through the
                Express API. Current entries are prototype test
                alerts until live sensors and fish behavior
                detection are integrated.
              </p>
            </div>
          </div>

          {/* Load Error */}
          {loadError && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">
                {loadError}
              </p>

              <p className="mt-1 text-xs text-red-600">
                Make sure the Express backend and MySQL server
                are running.
              </p>
            </div>
          )}

          {/* Action Error */}
          {actionError && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">
                {actionError}
              </p>
            </div>
          )}

          {/* Alert Summary */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Total Alerts
                </p>

                <Bell size={20} className="text-cyan-600" />
              </div>

              <p className="mt-3 text-3xl font-bold text-slate-900">
                {loading ? "--" : alerts.length}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Critical
                </p>

                <TriangleAlert
                  size={20}
                  className="text-red-600"
                />
              </div>

              <p className="mt-3 text-3xl font-bold text-red-600">
                {loading ? "--" : criticalCount}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Warnings
                </p>

                <Activity
                  size={20}
                  className="text-amber-600"
                />
              </div>

              <p className="mt-3 text-3xl font-bold text-amber-600">
                {loading ? "--" : warningCount}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Unacknowledged
                </p>

                <Clock size={20} className="text-cyan-600" />
              </div>

              <p className="mt-3 text-3xl font-bold text-slate-900">
                {loading ? "--" : unacknowledgedCount}
              </p>
            </div>
          </div>

          {/* Alert List */}
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Alert History
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Search, filter, and acknowledge stored alerts.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAcknowledgeAll}
                disabled={
                  loading ||
                  acknowledgingAll ||
                  unacknowledgedCount === 0
                }
                className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {acknowledgingAll
                  ? "Acknowledging..."
                  : "Acknowledge All"}
              </button>
            </div>

            {/* Search and Filters */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
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
                  placeholder="Search alerts..."
                  aria-label="Search alerts"
                  className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div className="relative">
                <Filter
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={severityFilter}
                  onChange={(event) =>
                    setSeverityFilter(
                      event.target.value as SeverityFilter
                    )
                  }
                  aria-label="Filter by severity"
                  className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-cyan-500"
                >
                  <option value="All">
                    All severity levels
                  </option>
                  <option value="Critical">Critical</option>
                  <option value="Warning">Warning</option>
                  <option value="Info">Info</option>
                </select>
              </div>

              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value as CategoryFilter
                  )
                }
                aria-label="Filter by category"
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500"
              >
                <option value="All">All categories</option>
                <option value="Water Quality">
                  Water Quality
                </option>
                <option value="Fish Behavior">
                  Fish Behavior
                </option>
                <option value="Equipment">
                  Equipment
                </option>
              </select>
            </div>

            <label className="mt-4 flex w-fit cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={showAcknowledged}
                onChange={(event) =>
                  setShowAcknowledged(event.target.checked)
                }
                className="h-4 w-4 accent-cyan-600"
              />

              Show acknowledged alerts
            </label>

            {/* Records */}
            <div className="mt-5 space-y-4">
              {loading && (
                <div className="rounded-xl border border-slate-200 px-6 py-12 text-center">
                  <p className="text-sm text-slate-500">
                    Loading alerts from the database...
                  </p>
                </div>
              )}

              {!loading &&
                filteredAlerts.map((alert) => {
                  const Icon = categoryIcon(alert.category);

                  return (
                    <div
                      key={alert.id}
                      className={`rounded-xl border p-5 ${
                        alert.acknowledged
                          ? "border-slate-200 bg-slate-50"
                          : alert.severity === "Critical"
                            ? "border-red-200 bg-white"
                            : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                            <Icon size={20} />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-slate-900">
                                {alert.title}
                              </h3>

                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${severityClass(
                                  alert.severity
                                )}`}
                              >
                                {alert.severity}
                              </span>
                            </div>

                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {alert.description}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                              <span>{alert.category}</span>
                              <span>•</span>
                              <span>{alert.time}</span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {alert.acknowledged ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                              <CheckCircle2 size={15} />
                              Acknowledged
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                handleAcknowledgeAlert(
                                  alert.id
                                )
                              }
                              disabled={
                                acknowledgingId === alert.id
                              }
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                            >
                              {acknowledgingId === alert.id
                                ? "Saving..."
                                : "Acknowledge"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

              {!loading &&
                filteredAlerts.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
                    <CheckCircle2
                      size={30}
                      className="mx-auto text-slate-400"
                    />

                    <p className="mt-3 font-medium text-slate-700">
                      No matching alerts
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {loadError
                        ? "Alerts could not be loaded from the database."
                        : "Try changing your search or filter settings."}
                    </p>
                  </div>
                )}
            </div>

            <p className="mt-5 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-400">
              Alerts and acknowledgement status are stored in
              MySQL through the SMART Aqua Pond Express API.
              Current alerts are prototype test records until
              live sensor and fish behavior detection are
              integrated.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}