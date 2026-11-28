"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  getArduinoHardwareStatus,
  getEquipmentLogs,
  type ArduinoHardwareStatus,
  type EquipmentLogRecord,
} from "@/lib/api";
import {
  Wind,
  Droplets,
  Utensils,
  Power,
  ShieldCheck,
  Activity,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

type EquipmentItem = {
  name: string;
  description: string;
  icon: typeof Wind;
  color: string;
  bg: string;
};

const equipment: EquipmentItem[] = [
  {
    name: "Aeration System",
    description:
      "Provides aeration. Automatic control requires a dissolved oxygen sensor; TDS cannot measure oxygen.",
    icon: Wind,
    color: "text-cyan-700",
    bg: "bg-cyan-50",
  },
  {
    name: "Water Pump",
    description:
      "Prepares for controlled partial water changes.",
    icon: Droplets,
    color: "text-blue-700",
    bg: "bg-blue-50",
  },
  {
    name: "Automatic Fish Feeder",
    description:
      "Controls the feeding mechanism when hardware is integrated.",
    icon: Utensils,
    color: "text-amber-700",
    bg: "bg-amber-50",
  },
];

export default function EquipmentControlPage() {
  const [equipmentLogs, setEquipmentLogs] = useState<
    EquipmentLogRecord[]
  >([]);
  const [equipmentLogsLoading, setEquipmentLogsLoading] =
    useState(true);
  const [equipmentLogsError, setEquipmentLogsError] =
    useState<string | null>(null);
  const [hardwareStatus, setHardwareStatus] =
    useState<ArduinoHardwareStatus | null>(null);
  const [hardwareStatusLoading, setHardwareStatusLoading] =
    useState(true);
  const [hardwareStatusError, setHardwareStatusError] =
    useState<string | null>(null);

  const showEquipmentLogsError = useCallback((error: unknown) => {
    console.error("Failed to load equipment logs:", error);
    setEquipmentLogsError(
      "Could not load equipment activity. Check the backend connection and try again."
    );
  }, []);

  async function refreshEquipmentLogs() {
    setEquipmentLogsLoading(true);
    setEquipmentLogsError(null);
    try {
      const logs = await getEquipmentLogs();
      setEquipmentLogs(logs);
    } catch (error) {
      showEquipmentLogsError(error);
    } finally {
      setEquipmentLogsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    getEquipmentLogs()
      .then((logs) => {
        if (isMounted) {
          setEquipmentLogs(logs);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          showEquipmentLogsError(error);
        }
      })
      .finally(() => {
        if (isMounted) {
          setEquipmentLogsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [showEquipmentLogsError]);

  useEffect(() => {
    let isMounted = true;

    function checkHardwareStatus() {
      getArduinoHardwareStatus()
        .then((status) => {
          if (isMounted) {
            setHardwareStatus(status);
            setHardwareStatusError(null);
          }
        })
        .catch(() => {
          if (isMounted) {
            setHardwareStatusError(
              "Could not read the Arduino connection status."
            );
          }
        })
        .finally(() => {
          if (isMounted) {
            setHardwareStatusLoading(false);
          }
        });
    }

    checkHardwareStatus();
    const statusInterval = window.setInterval(
      checkHardwareStatus,
      5000
    );

    return () => {
      isMounted = false;
      window.clearInterval(statusInterval);
    };
  }, []);

  const hardwareConnectionLabel = hardwareStatusLoading
    ? "Checking..."
    : hardwareStatusError
      ? "Status Unavailable"
      : hardwareStatus?.online
        ? "Online"
        : hardwareStatus?.connected
          ? "Waiting for Arduino"
          : hardwareStatus?.configured
            ? "Disconnected"
            : "Serial Port Not Configured";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex flex-1 flex-col">
        <Header />

        <div className="flex-1 bg-slate-50 p-8">
          {/* Page Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Equipment Control
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Monitor fishpond equipment and prepare for Arduino integration.
              </p>
            </div>

            <span
              className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${
                hardwareStatus?.online
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {hardwareStatus?.online ? (
                <Activity size={15} />
              ) : (
                <AlertTriangle size={15} />
              )}
              {hardwareStatus?.online
                ? "Arduino Online"
                : "Hardware Integration Pending"}
            </span>
          </div>

          {/* Hardware Integration Status */}
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <ShieldCheck
              size={21}
              className="mt-0.5 shrink-0 text-amber-700"
            />

            <div>
              <h2 className="text-sm font-semibold text-amber-900">
                {hardwareStatus?.online
                  ? "Arduino telemetry connection is active"
                  : hardwareStatus?.connected
                    ? "Waiting for Arduino telemetry"
                    : "Arduino hardware is not connected"}
              </h2>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                USB serial telemetry is supported. Sensor readings can be
                received from the Arduino, but actuator commands remain
                disabled until hardware wiring and safety behavior are
                verified.
              </p>
            </div>
          </div>

          {/* Equipment Summary */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                  <Activity size={21} />
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Equipment Modules
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    3
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Power size={21} />
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Hardware Status
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {hardwareConnectionLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <ShieldCheck size={21} />
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Integration Mode
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    Read-only
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Automatic Aeration Status */}
<div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
  <div className="flex items-center justify-between gap-4">
    <div>
      <h2 className="text-base font-semibold text-slate-900">
        Automatic Aeration Status
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Saved automatic aeration request from MySQL.
      </p>
    </div>

    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
      Not Integrated
    </span>
  </div>

  <div className="mt-5 rounded-lg bg-slate-50 p-4">
    <p className="text-sm text-slate-600">
      Status:{" "}
      <span className="font-semibold text-slate-900">
        Unavailable
      </span>
    </p>

    <p className="mt-2 text-sm text-slate-600">
      A dissolved oxygen sensor is required for automatic
      aeration. TDS readings cannot control it.
    </p>

    <p className="mt-3 text-xs text-slate-500">
      No automatic aeration request is sent.
    </p>
  </div>
</div>

          {/* Equipment Controls */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">
              Equipment Modules
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Controls will become available after the Arduino connection and
              device safety checks are implemented.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-2">
              {equipment.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.name}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.bg} ${item.color}`}
                        >
                          <Icon size={24} />
                        </div>

                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {item.name}
                          </h3>

                          <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Not Connected
                      </span>
                    </div>

                    <div className="mt-6 rounded-lg bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">
                          Device Status
                        </span>

                        <span className="text-sm text-slate-500">
                          Actuator status unavailable
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled
                      className="mt-5 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-500"
                    >
                      <Power size={17} />
                      Actuator Commands Disabled
                    </button>

                    <p className="mt-3 text-xs text-slate-400">
                      Telemetry-only mode; no equipment command is sent.
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Equipment Activity Logs */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Equipment Activity
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Verified equipment events will appear here when the
                  controller integration reports them.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                  Telemetry Only
                </span>
                <button
                  type="button"
                  onClick={() => void refreshEquipmentLogs()}
                  disabled={equipmentLogsLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    size={16}
                    className={equipmentLogsLoading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3 font-semibold">
                      Equipment
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Action
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Mode
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Status
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Date / Time
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {equipmentLogsError ? (
                    <tr>
                      <td
                        colSpan={5}
                        role="alert"
                        className="px-3 py-8 text-center text-sm text-red-700"
                      >
                        {equipmentLogsError}
                      </td>
                    </tr>
                  ) : equipmentLogsLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-8 text-center text-sm text-slate-500"
                      >
                        Loading equipment activity...
                      </td>
                    </tr>
                  ) : equipmentLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-8 text-center text-sm text-slate-500"
                      >
                        No hardware activity has been received yet.
                      </td>
                    </tr>
                  ) : (
                    equipmentLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-slate-100 last:border-b-0"
                      >
                        <td className="px-3 py-4 text-sm font-medium text-slate-800">
                          {log.equipment_name}
                        </td>

                        <td className="px-3 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              log.action === "ON"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td className="px-3 py-4 text-sm text-slate-600">
                          {log.control_mode}
                        </td>

                        <td className="px-3 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              log.status === "Success"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>

                        <td className="px-3 py-4 text-sm text-slate-500">
                          {new Date(
                            log.recorded_at
                          ).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Connection Information */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              Hardware Connection
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Arduino UNO R4 Minima via USB serial
            </p>

            <div className="mt-5 flex items-center gap-3 rounded-lg bg-slate-50 p-4">
              <span className="h-3 w-3 rounded-full bg-slate-400" />

              <div>
                <p className="text-sm font-medium text-slate-700">
                  {hardwareConnectionLabel}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {hardwareStatus?.configured
                    ? `${hardwareStatus.port} at ${hardwareStatus.baudRate} baud`
                    : "Set ARDUINO_SERIAL_PORT in backend/.env to enable the serial bridge."}
                </p>
              </div>
            </div>

            {hardwareStatus?.lastMessageAt && (
              <p className="mt-3 text-xs text-slate-500">
                Last controller message:{" "}
                {new Date(
                  hardwareStatus.lastMessageAt
                ).toLocaleString()}
              </p>
            )}

            {hardwareStatus?.lastTelemetryAt && (
              <p className="mt-1 text-xs text-slate-500">
                Last sensor reading:{" "}
                {new Date(
                  hardwareStatus.lastTelemetryAt
                ).toLocaleString()}
              </p>
            )}

            {hardwareStatus?.firmwareVersion && (
              <p className="mt-1 text-xs text-slate-500">
                Firmware: {hardwareStatus.firmwareVersion}
              </p>
            )}

            {(hardwareStatusError || hardwareStatus?.lastError) && (
              <p
                role="alert"
                className="mt-3 text-sm text-red-700"
              >
                {hardwareStatusError ?? hardwareStatus?.lastError}
              </p>
            )}

            <p className="mt-4 text-xs leading-5 text-slate-400">
              The current bridge is telemetry-only. Equipment commands are
              intentionally unavailable until actuator wiring, fail-safe
              behavior, and hardware feedback are confirmed.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}