import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  getFishBehaviorLogs,
  type FishBehaviorRecord,
} from "@/lib/api";

export default async function FishMonitoringPage() {
  let behaviorLogs: FishBehaviorRecord[] = [];

  try {
    behaviorLogs = await getFishBehaviorLogs();
  } catch (error) {
    console.error("Failed to load fish behavior logs:", error);
  }

  const latestBehavior = behaviorLogs[0] ?? null;

  const isAbnormal =
    latestBehavior?.activity_status === "Abnormal";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex flex-1 flex-col">
        <Header />

        <div className="flex-1 bg-slate-50 p-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Fish Monitoring
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor fish activity, camera feed, and possible abnormal behavior.
          </p>

          {/* Fish Camera Monitoring */}
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Fish Camera Monitoring
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Live pond camera feed from ESP32-CAM.
                </p>
              </div>

              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                Prototype
              </span>
            </div>

            <div className="mt-6 flex h-80 items-center justify-center rounded-xl bg-slate-900">
              <div className="text-center">
                <p className="text-base font-semibold text-white">
                  ESP32-CAM Preview
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  Live camera feed will appear here.
                </p>
              </div>
            </div>

            {/* Camera Connection Status */}
            <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  ESP32-CAM
                </p>

                <p className="text-xs text-slate-500">
                  Pond monitoring camera
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

          {/* Fish Activity Status */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Fish Activity Status
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Latest fish behavior record stored in the database.
                </p>
              </div>

              {latestBehavior ? (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    isAbnormal
                      ? "bg-red-50 text-red-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {latestBehavior.activity_status}
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  No Data
                </span>
              )}
            </div>

            <div className="mt-6">
              <p className="text-sm text-slate-500">
                Current Activity
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {latestBehavior
                  ? `${latestBehavior.activity_status} Activity`
                  : "No Behavior Data"}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                {latestBehavior?.description ??
                  "No fish behavior analysis has been stored yet."}
              </p>
            </div>

            <div className="mt-4 rounded-lg bg-cyan-50 px-4 py-3">
              <p className="text-xs text-cyan-800">
                Fish behavior records shown here are database records.
                Live ESP32-CAM and computer vision analysis are not yet
                integrated.
              </p>
            </div>
          </div>

          {/* Behavior Detection Status */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Behavior Detection
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Computer vision analysis for possible abnormal fish
                  behavior.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                Not Active
              </span>
            </div>

            {/* Detection Details */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">
                  Behavior Type
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {latestBehavior?.behavior_type ??
                    "Awaiting analysis"}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">
                  Confidence Score
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {latestBehavior?.confidence_score
                    ? `${latestBehavior.confidence_score}%`
                    : "Awaiting analysis"}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">
                  Possible Abnormal Behavior
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {latestBehavior
                    ? isAbnormal
                      ? "Possible abnormal behavior recorded"
                      : "No abnormal behavior recorded"
                    : "Awaiting analysis"}
                </p>
              </div>
            </div>

            {/* Last Analysis */}
            <div className="mt-4 border-t border-slate-200 pt-4">
              <p className="text-xs text-slate-500">
                Last Analysis:{" "}
                <span className="font-medium text-slate-700">
                  {latestBehavior
                    ? new Date(
                        latestBehavior.detected_at
                      ).toLocaleString()
                    : "No analysis yet"}
                </span>
              </p>
            </div>
          </div>

          {/* Behavior History */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Behavior History
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Fish behavior records stored in MySQL.
                </p>
              </div>

              <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">
                MySQL Data
              </span>
            </div>

            {behaviorLogs.length === 0 ? (
              <div className="mt-6 rounded-lg bg-slate-50 p-6 text-center">
                <p className="text-sm font-medium text-slate-700">
                  No fish behavior records
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Records will appear here after behavior data is
                  stored.
                </p>
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                      <th className="px-4 py-3 font-medium">
                        Status
                      </th>
                      <th className="px-4 py-3 font-medium">
                        Behavior
                      </th>
                      <th className="px-4 py-3 font-medium">
                        Confidence
                      </th>
                      <th className="px-4 py-3 font-medium">
                        Description
                      </th>
                      <th className="px-4 py-3 font-medium">
                        Detected At
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {behaviorLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-slate-100"
                      >
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              log.activity_status === "Abnormal"
                                ? "bg-red-50 text-red-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {log.activity_status}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-slate-700">
                          {log.behavior_type ?? "—"}
                        </td>

                        <td className="px-4 py-4 text-slate-700">
                          {log.confidence_score
                            ? `${log.confidence_score}%`
                            : "—"}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {log.description ?? "—"}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {new Date(
                            log.detected_at
                          ).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}