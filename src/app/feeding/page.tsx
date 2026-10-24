"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  getFeedingSchedule,
  saveFeedingSchedule,
  resetFeedingSchedule,
  getFeedingHistory,
  type FeedingHistoryRecord,
  type FeedingScheduleRecord,
} from "@/lib/api";
import {
  Utensils,
  Clock,
  CalendarDays,
  CheckCircle2,
  Pencil,
  RotateCcw,
  X,
  History,
  Search,
  Filter,
} from "lucide-react";

const feedingDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

type FeedingSchedule = {
  morningTime: string;
  afternoonTime: string;
  days: string[];
};

type StatusFilter =
  | "All"
  | FeedingHistoryRecord["status"];

type TriggerFilter =
  | "All"
  | FeedingHistoryRecord["trigger_type"];

export default function FeedingPage() {
  const [morningTime, setMorningTime] = useState("");
  const [afternoonTime, setAfternoonTime] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const [savedSchedule, setSavedSchedule] =
    useState<FeedingSchedule | null>(null);

  const [message, setMessage] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [showResetConfirmation, setShowResetConfirmation] =
    useState(false);

  const [feedingHistory, setFeedingHistory] =
    useState<FeedingHistoryRecord[]>([]);

  const [isHistoryLoading, setIsHistoryLoading] =
    useState(true);

  const [historyError, setHistoryError] =
    useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All");

  const [triggerFilter, setTriggerFilter] =
    useState<TriggerFilter>("All");

  useEffect(() => {
    async function loadFeedingSchedule() {
      try {
        const records: FeedingScheduleRecord[] =
          await getFeedingSchedule();

        if (records.length < 2) {
          setSavedSchedule(null);
          setMorningTime("");
          setAfternoonTime("");
          setSelectedDays([]);
          return;
        }

        const sortedRecords = [...records].sort((a, b) =>
          a.feeding_time.localeCompare(b.feeding_time)
        );

        const morningRecord = sortedRecords[0];
        const afternoonRecord = sortedRecords[1];

        const normalizeTime = (time: string) =>
          time.slice(0, 5);

        const parseDays = (
          value: string[] | string
        ): string[] => {
          if (Array.isArray(value)) {
            return value;
          }

          try {
            const parsed: unknown = JSON.parse(value);

            if (
              Array.isArray(parsed) &&
              parsed.every(
                (day) => typeof day === "string"
              )
            ) {
              return parsed;
            }
          } catch {
            return [];
          }

          return [];
        };

        const morningDays = parseDays(
          morningRecord.feeding_days
        );

        const afternoonDays = parseDays(
          afternoonRecord.feeding_days
        );

        const combinedDays = feedingDays.filter(
          (day) =>
            morningDays.includes(day) &&
            afternoonDays.includes(day)
        );

        const schedule: FeedingSchedule = {
          morningTime: normalizeTime(
            morningRecord.feeding_time
          ),
          afternoonTime: normalizeTime(
            afternoonRecord.feeding_time
          ),
          days: combinedDays,
        };

        setMorningTime(schedule.morningTime);
        setAfternoonTime(schedule.afternoonTime);
        setSelectedDays(schedule.days);
        setSavedSchedule(schedule);
      } catch (error) {
        console.error(
          "Failed to load feeding schedule:",
          error
        );

        setMessage(
          "Unable to load the feeding schedule from the database."
        );
      } finally {
        setIsLoaded(true);
      }
    }

    loadFeedingSchedule();
  }, []);

  useEffect(() => {
    async function loadFeedingHistory() {
      try {
        setIsHistoryLoading(true);
        setHistoryError("");

        const records = await getFeedingHistory();

        setFeedingHistory(records);
      } catch (error) {
        console.error(
          "Failed to load feeding history:",
          error
        );

        setHistoryError(
          "Unable to load feeding history from the database."
        );
      } finally {
        setIsHistoryLoading(false);
      }
    }

    loadFeedingHistory();
  }, []);

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return feedingHistory.filter((record) => {
      const formattedDate = new Date(
        record.fed_at
      ).toLocaleDateString();

      const formattedTime = new Date(
        record.fed_at
      ).toLocaleTimeString();

      const matchesSearch =
        !query ||
        formattedDate.toLowerCase().includes(query) ||
        formattedTime.toLowerCase().includes(query) ||
        record.trigger_type
          .toLowerCase()
          .includes(query) ||
        record.status
          .toLowerCase()
          .includes(query) ||
        (record.amount ?? "")
          .toString()
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        record.status === statusFilter;

      const matchesTrigger =
        triggerFilter === "All" ||
        record.trigger_type === triggerFilter;

      return matchesSearch &&
        matchesStatus &&
        matchesTrigger;
    });
  }, [
    feedingHistory,
    searchTerm,
    statusFilter,
    triggerFilter,
  ]);

  function toggleDay(day: string) {
    setSelectedDays((currentDays) =>
      currentDays.includes(day)
        ? currentDays.filter((item) => item !== day)
        : feedingDays.filter(
            (item) =>
              item === day ||
              currentDays.includes(item)
          )
    );

    setMessage("");
  }

  function startEditing() {
    if (savedSchedule) {
      setMorningTime(savedSchedule.morningTime);
      setAfternoonTime(savedSchedule.afternoonTime);
      setSelectedDays([...savedSchedule.days]);
    }

    setIsEditing(true);
    setMessage("");
  }

  function cancelEditing() {
    if (savedSchedule) {
      setMorningTime(savedSchedule.morningTime);
      setAfternoonTime(savedSchedule.afternoonTime);
      setSelectedDays([...savedSchedule.days]);
    } else {
      setMorningTime("");
      setAfternoonTime("");
      setSelectedDays([]);
    }

    setIsEditing(false);
    setMessage("");
  }

  async function saveSchedule() {
    if (!morningTime || !afternoonTime) {
      setMessage(
        "Please select both morning and afternoon feeding times."
      );
      return;
    }

    if (selectedDays.length === 0) {
      setMessage(
        "Please select at least one feeding day."
      );
      return;
    }

    if (morningTime >= afternoonTime) {
      setMessage(
        "Afternoon feeding must be later than morning feeding."
      );
      return;
    }

    const schedule: FeedingSchedule = {
      morningTime,
      afternoonTime,
      days: feedingDays.filter((day) =>
        selectedDays.includes(day)
      ),
    };

    try {
      setIsSaving(true);
      setMessage("");

      await saveFeedingSchedule(schedule);

      setSavedSchedule(schedule);
      setSelectedDays(schedule.days);
      setIsEditing(false);

      setMessage(
        "Feeding schedule saved successfully to the database."
      );
    } catch (error) {
      console.error(
        "Failed to save feeding schedule:",
        error
      );

      setMessage(
        "Unable to save the feeding schedule to the database."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function resetSchedule() {
    try {
      setIsResetting(true);
      setMessage("");

      await resetFeedingSchedule();

      setSavedSchedule(null);
      setMorningTime("");
      setAfternoonTime("");
      setSelectedDays([]);
      setIsEditing(false);
      setShowResetConfirmation(false);

      setMessage(
        "Feeding schedule has been reset successfully."
      );
    } catch (error) {
      console.error(
        "Failed to reset feeding schedule:",
        error
      );

      setMessage(
        "Unable to reset the feeding schedule in the database."
      );
    } finally {
      setIsResetting(false);
    }
  }

  function formatScheduleTime(time: string) {
    if (!time) return "Not set";

    const [hours, minutes] =
      time.split(":").map(Number);

    const date = new Date();

    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatHistoryDate(dateString: string) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Invalid date";
    }

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatHistoryTime(dateString: string) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Invalid time";
    }

    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function statusClass(
    status: FeedingHistoryRecord["status"]
  ) {
    switch (status) {
      case "Completed":
        return "bg-emerald-50 text-emerald-700";

      case "Failed":
        return "bg-red-50 text-red-700";

      case "Pending":
        return "bg-amber-50 text-amber-700";
    }
  }

  const canEdit = !savedSchedule || isEditing;
  const isBusy = isSaving || isResetting;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex flex-1 flex-col">
        <Header />

        <div className="flex-1 bg-slate-50 p-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Feeding
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage feeding schedules and review feeding records.
          </p>

          {/* Feeder Status */}
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                  <Utensils size={24} />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Automatic Fish Feeder
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Feeding mechanism status
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                Standby
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock size={18} />

                  <p className="text-sm font-medium">
                    Feeder Mode
                  </p>
                </div>

                <p className="mt-2 text-lg font-semibold text-slate-900">
                  Automatic
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Prototype configuration
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <CalendarDays size={18} />

                  <p className="text-sm font-medium">
                    Feeding Schedule
                  </p>
                </div>

                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {!isLoaded
                    ? "Loading..."
                    : savedSchedule
                      ? "Configured"
                      : "Not Configured"}
                </p>

                {savedSchedule ? (
                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                    <p>
                      Morning:{" "}
                      {formatScheduleTime(
                        savedSchedule.morningTime
                      )}
                    </p>

                    <p>
                      Afternoon:{" "}
                      {formatScheduleTime(
                        savedSchedule.afternoonTime
                      )}
                    </p>

                    <p>
                      {savedSchedule.days.join(", ")}
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">
                    No feeding schedule has been saved.
                  </p>
                )}
              </div>
            </div>

            <p className="mt-5 border-t border-slate-200 pt-4 text-xs text-slate-400">
              Prototype mode — no physical feeder commands are
              being sent.
            </p>

            <div className="mt-6 border-t border-slate-200 pt-6">
              <h3 className="text-base font-semibold text-slate-900">
                Manual Feeding
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Manually trigger the fish feeder when needed.
              </p>

              <button
                type="button"
                disabled
                title="Hardware integration is not yet available"
                className="mt-4 inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-slate-300 px-5 py-3 text-sm font-semibold text-slate-600"
              >
                <Utensils size={18} />
                Feed Fish Now
              </button>

              <p className="mt-2 text-xs text-slate-400">
                Disabled until the physical feeder is connected.
              </p>
            </div>
          </div>

          {/* Schedule Configuration */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                <CalendarDays size={22} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Feeding Schedule Configuration
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Set feeding times and choose feeding days.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="morning-feeding"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Morning Feeding
                </label>

                <input
                  id="morning-feeding"
                  type="time"
                  value={morningTime}
                  disabled={
                    !isLoaded ||
                    !canEdit ||
                    isBusy
                  }
                  onChange={(event) => {
                    setMorningTime(event.target.value);
                    setMessage("");
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="afternoon-feeding"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Afternoon Feeding
                </label>

                <input
                  id="afternoon-feeding"
                  type="time"
                  value={afternoonTime}
                  disabled={
                    !isLoaded ||
                    !canEdit ||
                    isBusy
                  }
                  onChange={(event) => {
                    setAfternoonTime(event.target.value);
                    setMessage("");
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-medium text-slate-700">
                Feeding Days
              </p>

              <div className="flex flex-wrap gap-3">
                {feedingDays.map((day) => (
                  <label
                    key={day}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      selectedDays.includes(day)
                        ? "border-cyan-500 bg-cyan-50 text-cyan-800"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    } ${
                      !canEdit ||
                      !isLoaded ||
                      isBusy
                        ? "cursor-not-allowed opacity-70"
                        : "cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(day)}
                      disabled={
                        !isLoaded ||
                        !canEdit ||
                        isBusy
                      }
                      onChange={() => toggleDay(day)}
                      className="h-4 w-4 accent-cyan-600"
                    />

                    {day}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                {savedSchedule && !isEditing
                  ? "Your saved schedule is ready to edit or reset."
                  : "Choose your feeding times and days, then save."}
              </p>

              <div className="flex flex-wrap gap-3">
                {savedSchedule && !isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={startEditing}
                      disabled={isBusy}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Pencil size={17} />
                      Edit Schedule
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMessage("");
                        setShowResetConfirmation(true);
                      }}
                      disabled={isBusy}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RotateCcw size={17} />
                      Reset Schedule
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={saveSchedule}
                      disabled={!isLoaded || isBusy}
                      className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-wait disabled:bg-slate-300"
                    >
                      <CalendarDays size={18} />

                      {isSaving
                        ? "Saving..."
                        : "Save Schedule"}
                    </button>

                    {isEditing && (
                      <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={isBusy}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <X size={17} />
                        Cancel
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {showResetConfirmation && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                <h3 className="text-sm font-semibold text-red-800">
                  Reset feeding schedule?
                </h3>

                <p className="mt-1 text-sm text-red-700">
                  This removes the saved feeding schedule from
                  the SMART Aqua Pond database. It does not send
                  commands to the physical feeder.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={resetSchedule}
                    disabled={isResetting}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-wait disabled:bg-red-300"
                  >
                    {isResetting
                      ? "Resetting..."
                      : "Yes, Reset Schedule"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setShowResetConfirmation(false)
                    }
                    disabled={isResetting}
                    className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Keep Schedule
                  </button>
                </div>
              </div>
            )}

            {message && (
              <div
                role="status"
                className={`mt-4 flex items-start gap-2 rounded-lg p-3 text-sm ${
                  message.includes("successfully")
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-800"
                }`}
              >
                {message.includes("successfully") && (
                  <CheckCircle2
                    size={18}
                    className="shrink-0"
                  />
                )}

                <span>{message}</span>
              </div>
            )}
          </div>

          {/* Feeding History */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                  <History size={22} />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Feeding History
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Review feeding events stored in the database.
                  </p>
                </div>
              </div>

              <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                MySQL Data
              </span>
            </div>

            {/* Filters */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder="Search date, time, status..."
                  aria-label="Search feeding history"
                  className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div className="relative">
                <Filter
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as StatusFilter
                    )
                  }
                  aria-label="Filter by feeding status"
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-cyan-500"
                >
                  <option value="All">
                    All statuses
                  </option>

                  <option value="Completed">
                    Completed
                  </option>

                  <option value="Pending">
                    Pending
                  </option>

                  <option value="Failed">
                    Failed
                  </option>
                </select>
              </div>

              <select
                value={triggerFilter}
                onChange={(event) =>
                  setTriggerFilter(
                    event.target.value as TriggerFilter
                  )
                }
                aria-label="Filter by feeding trigger"
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-cyan-500"
              >
                <option value="All">
                  All trigger types
                </option>

                <option value="Automatic">
                  Automatic
                </option>

                <option value="Manual">
                  Manual
                </option>
              </select>
            </div>

            {/* Records Table */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                    <th className="px-4 py-3 font-medium">
                      Date
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Time
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Trigger Type
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Amount
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {isHistoryLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        Loading feeding history...
                      </td>
                    </tr>
                  ) : historyError ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-red-600"
                      >
                        {historyError}
                      </td>
                    </tr>
                  ) : filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                      <tr
                        key={record.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-4 py-4 text-slate-700">
                          {formatHistoryDate(
                            record.fed_at
                          )}
                        </td>

                        <td className="px-4 py-4 text-slate-700">
                          {formatHistoryTime(
                            record.fed_at
                          )}
                        </td>

                        <td className="px-4 py-4 text-slate-700">
                          {record.trigger_type}
                        </td>

                        <td className="px-4 py-4 text-slate-700">
                          {record.amount !== null
                            ? `${record.amount} g`
                            : "Not recorded"}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusClass(
                              record.status
                            )}`}
                          >
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        {feedingHistory.length === 0
                          ? "No feeding history has been recorded yet."
                          : "No feeding records match your filters."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Feeding history is loaded from the SMART Aqua Pond
              MySQL database. Current records are prototype/test
              records until the physical feeder is integrated.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}