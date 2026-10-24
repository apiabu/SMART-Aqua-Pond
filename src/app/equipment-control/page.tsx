"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  getEquipmentLogs,
  saveEquipmentLog,
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
  RotateCcw,
} from "lucide-react";

type EquipmentState = {
  aeration: boolean;
  waterPump: boolean;
  feeder: boolean;
};

type EquipmentItem = {
  id: keyof EquipmentState;
  name: string;
  description: string;
  icon: typeof Wind;
  color: string;
  bg: string;
};

const equipment: EquipmentItem[] = [
  {
    id: "aeration",
    name: "Aeration System",
    description:
      "Supports dissolved oxygen levels in the fishpond.",
    icon: Wind,
    color: "text-cyan-700",
    bg: "bg-cyan-50",
  },
  {
    id: "waterPump",
    name: "Water Pump",
    description:
      "Prepares for controlled partial water changes.",
    icon: Droplets,
    color: "text-blue-700",
    bg: "bg-blue-50",
  },
  {
    id: "feeder",
    name: "Automatic Fish Feeder",
    description:
      "Controls the feeding mechanism when hardware is integrated.",
    icon: Utensils,
    color: "text-amber-700",
    bg: "bg-amber-50",
  },
];

export default function EquipmentControlPage() {
  const [states, setStates] = useState<EquipmentState>({
    aeration: false,
    waterPump: false,
    feeder: false,
  });

  const [message, setMessage] = useState(
    "Prototype mode is active. No physical equipment commands are sent."
  );

  const [equipmentLogs, setEquipmentLogs] = useState<
    EquipmentLogRecord[]
  >([]);

  useEffect(() => {
    async function loadEquipmentLogs() {
      try {
        const logs = await getEquipmentLogs();
        setEquipmentLogs(logs);
      } catch (error) {
        console.error(
          "Failed to load equipment logs:",
          error
        );
      }
    }

    loadEquipmentLogs();
  }, []);

  async function togglePrototype(id: keyof EquipmentState) {
    const equipmentItem = equipment.find(
      (item) => item.id === id
    );

    if (!equipmentItem) {
      return;
    }

    const nextValue = !states[id];
    const action: "ON" | "OFF" = nextValue ? "ON" : "OFF";

    try {
      await saveEquipmentLog({
        equipment_name: equipmentItem.name,
        action,
        details:
          "Prototype control action. No physical hardware command was sent.",
      });

      const updatedLogs = await getEquipmentLogs();
      setEquipmentLogs(updatedLogs);

      setStates((current) => ({
        ...current,
        [id]: nextValue,
      }));

      setMessage(
        `${equipmentItem.name}: prototype state changed to ${action}. Action saved to MySQL. No hardware command was sent.`
      );
    } catch (error) {
      console.error(
        "Failed to save equipment action:",
        error
      );

      setMessage(
        `${equipmentItem.name}: unable to save the prototype action. State was not changed.`
      );
    }
  }

  async function resetPrototype() {
    const activeEquipment = equipment.filter(
      (item) => states[item.id]
    );

    if (activeEquipment.length === 0) {
      setMessage(
        "All prototype equipment is already OFF. No changes were needed."
      );
      return;
    }

    try {
      for (const item of activeEquipment) {
        await saveEquipmentLog({
          equipment_name: item.name,
          action: "OFF",
          details:
            "Prototype reset action. No physical hardware command was sent.",
        });
      }

      const updatedLogs = await getEquipmentLogs();
      setEquipmentLogs(updatedLogs);

      setStates({
        aeration: false,
        waterPump: false,
        feeder: false,
      });

      setMessage(
        "All active prototype controls have been reset to OFF. Reset actions were saved to MySQL. No hardware command was sent."
      );
    } catch (error) {
      console.error(
        "Failed to reset prototype equipment:",
        error
      );

      setMessage(
        "Unable to complete the prototype reset. Equipment states were not changed."
      );
    }
  }

  const activeCount = Object.values(states).filter(Boolean).length;

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
                Monitor equipment and prepare manual controls for the fishpond.
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              <AlertTriangle size={15} />
              Prototype Mode
            </span>
          </div>

          {/* Prototype Warning */}
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <ShieldCheck
              size={21}
              className="mt-0.5 shrink-0 text-amber-700"
            />

            <div>
              <h2 className="text-sm font-semibold text-amber-900">
                Hardware controls are simulated
              </h2>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Buttons on this page change the displayed prototype state only.
                They do not send commands to the Arduino Mega 2560, water pump,
                aerator, or fish feeder.
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
                    Simulated ON
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {activeCount}
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
                    Hardware Connection
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    Not Integrated
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Equipment Controls */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">
              Equipment Modules
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Use the simulated controls to preview the interface.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-2">
              {equipment.map((item) => {
                const Icon = item.icon;
                const isOn = states[item.id];

                return (
                  <div
                    key={item.id}
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

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                          isOn
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isOn ? "ON" : "OFF"}
                      </span>
                    </div>

                    <div className="mt-6 rounded-lg bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">
                          Prototype Status
                        </span>

                        <span className="text-sm text-slate-500">
                          {isOn ? "Enabled" : "Standby"}
                        </span>
                      </div>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOn ? "w-full bg-cyan-500" : "w-0"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex gap-3">
                      <button
                        type="button"
                        onClick={() => togglePrototype(item.id)}
                        aria-pressed={isOn}
                        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                          isOn
                            ? "bg-red-50 text-red-700 hover:bg-red-100"
                            : "bg-cyan-600 text-white hover:bg-cyan-700"
                        }`}
                      >
                        <Power size={17} />
                        {isOn ? "Turn OFF" : "Turn ON"}
                      </button>
                    </div>

                    <p className="mt-3 text-xs text-slate-400">
                      Simulation only — hardware is not connected.
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Feedback */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Control Activity
                </h2>

                <p
                  role="status"
                  aria-live="polite"
                  className="mt-2 text-sm leading-6 text-slate-600"
                >
                  {message}
                </p>
              </div>

              <button
                type="button"
                onClick={resetPrototype}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw size={17} />
                Reset All
              </button>
            </div>
          </div>

          {/* Equipment Activity Logs */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Equipment Activity
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Prototype equipment actions saved in MySQL.
                </p>
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                MySQL Data
              </span>
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
                  {equipmentLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-8 text-center text-sm text-slate-500"
                      >
                        No equipment activity has been recorded yet.
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
              Arduino Mega 2560 controller
            </p>

            <div className="mt-5 flex items-center gap-3 rounded-lg bg-slate-50 p-4">
              <span className="h-3 w-3 rounded-full bg-slate-400" />

              <div>
                <p className="text-sm font-medium text-slate-700">
                  Not Connected
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Hardware communication has not been configured.
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-400">
              Future integration will require a defined communication method,
              hardware command handling, connection monitoring, and safety
              interlocks before real equipment can be controlled.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}