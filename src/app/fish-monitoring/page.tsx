
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ManualFishBehaviorForm from "@/components/ManualFishBehaviorForm";
import ManualFishAppearanceForm from "@/components/ManualFishAppearanceForm";
import {
  getFishBehaviorLogs,
  getFishAppearanceLogs,
  getFishProfiles,
  type FishBehaviorRecord,
  type FishAppearanceRecord,
  type FishProfileRecord,
} from "@/lib/api";

export const dynamic = "force-dynamic";

// ======================================================
// HELPERS
// ======================================================

function statusStyle(abnormal: boolean) {
  return abnormal
    ? "bg-red-50 text-red-700"
    : "bg-emerald-50 text-emerald-700";
}

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : date.toLocaleString();
}

// ======================================================
// FISH MONITORING PAGE
// ======================================================

export default async function FishMonitoringPage() {
  let behaviorLogs: FishBehaviorRecord[] = [];
  let appearanceLogs: FishAppearanceRecord[] = [];
  let fishProfiles: FishProfileRecord[] = [];

  let behaviorError = false;
  let appearanceError = false;
  let profilesError = false;

  // Fetch all data from MySQL through the backend APIs
  const results = await Promise.allSettled([
    getFishBehaviorLogs(),
    getFishAppearanceLogs(),
    getFishProfiles(),
  ]);

  // Fish behavior records
  if (results[0].status === "fulfilled") {
    behaviorLogs = results[0].value;
  } else {
    behaviorError = true;
    console.error(
      "Failed to load behavior logs:",
      results[0].reason
    );
  }

  // Fish appearance records
  if (results[1].status === "fulfilled") {
    appearanceLogs = results[1].value;
  } else {
    appearanceError = true;
    console.error(
      "Failed to load appearance logs:",
      results[1].reason
    );
  }

  // Registered fish profiles
  if (results[2].status === "fulfilled") {
    fishProfiles = results[2].value;
  } else {
    profilesError = true;
    console.error(
      "Failed to load fish profiles:",
      results[2].reason
    );
  }

  const latestBehavior = behaviorLogs[0] ?? null;
  const latestAppearance = appearanceLogs[0] ?? null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex flex-1 flex-col">
        <Header />

        <div className="flex-1 p-8">
          {/* PAGE HEADER */}
          <h1 className="text-2xl font-bold text-slate-900">
            Fish Monitoring
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor registered fish activity, appearance,
            and possible abnormalities.
          </p>

          {/* ==========================================
              CAMERA MONITORING
          ========================================== */}
          <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Fish Camera Monitoring
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Camera integration is being prepared.
                </p>
              </div>

              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                Prototype
              </span>
            </div>

            <div className="mt-6 flex h-80 flex-col items-center justify-center rounded-xl bg-slate-900 px-4 text-center">
              <p className="text-lg font-semibold text-white">
                Camera Not Connected
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Live fish video will appear here after
                camera integration.
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Pond Monitoring Camera
                </p>

                <p className="text-xs text-slate-500">
                  OV7670 planned; connection not established
                </p>
              </div>

              <span className="text-sm font-medium text-slate-500">
                Not Connected
              </span>
            </div>
          </section>

          {/* ==========================================
              FISH PROFILES FROM MYSQL
          ========================================== */}
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">
              Fish Profiles
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Registered fish retrieved from the SMART
              Aqua Pond database.
            </p>

            {profilesError && (
              <p className="mt-4 text-sm text-red-600">
                Failed to load fish profiles from MySQL.
              </p>
            )}

            {!profilesError && fishProfiles.length === 0 && (
              <p className="mt-4 text-sm text-slate-500">
                No registered fish profiles found.
              </p>
            )}

            {!profilesError && fishProfiles.length > 0 && (
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                {fishProfiles.map((fish) => {
                  const behavior = behaviorLogs.find(
                    (log) => log.fish_id === fish.id
                  );

                  const appearance = appearanceLogs.find(
                    (log) => log.fish_id === fish.id
                  );

                  return (
                    <div
                      key={fish.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">
                          🐟
                        </span>

                        <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-500">
                          {fish.species}
                        </span>
                      </div>

                      <h3 className="mt-3 font-semibold text-slate-900">
                        {fish.fish_name}
                      </h3>

                      <div className="mt-4 space-y-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">
                            Latest Behavior Record
                          </p>

                          <p className="mt-1 font-medium text-slate-800">
                            {behaviorError
                              ? "Unavailable"
                              : behavior
                                ? behavior.behavior_type ??
                                  behavior.activity_status
                                : "No observations yet"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Latest Appearance Record
                          </p>

                          <p className="mt-1 font-medium text-slate-800">
                            {appearanceError
                              ? "Unavailable"
                              : appearance
                                ? appearance.abnormality_type ??
                                  appearance.appearance_status
                                : "No observations yet"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="mt-4 text-xs text-slate-500">
              Fish profiles are retrieved from MySQL.
              Individual camera identification is not yet active.
            </p>
          </section>

          {/* ==========================================
    MANUAL FISH BEHAVIOR OBSERVATION
========================================== */}
{!profilesError && (
  <ManualFishBehaviorForm fishProfiles={fishProfiles} />
)}

{/* ==========================================
    MANUAL FISH APPEARANCE OBSERVATION
========================================== */}
{!profilesError && (
  <ManualFishAppearanceForm fishProfiles={fishProfiles} />
)}
          {/* ==========================================
              BEHAVIOR AND APPEARANCE MONITORING
          ========================================== */}
          <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* BEHAVIOR MONITORING */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-slate-900">
                  Behavior Monitoring
                </h2>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  Detection Not Active
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Review recorded swimming activity and
                possible abnormal behavior.
              </p>

              <div className="mt-5 rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-500">
                  Latest Database Record
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {behaviorError
                    ? "Unable to load records"
                    : latestBehavior
                      ? latestBehavior.behavior_type ??
                        latestBehavior.activity_status
                      : "No behavior records"}
                </p>

                {latestBehavior && !behaviorError && (
                  <>
                    <span
                      className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-medium ${statusStyle(
                        latestBehavior.activity_status ===
                          "Abnormal"
                      )}`}
                    >
                      {latestBehavior.activity_status}
                    </span>

                    <p className="mt-3 text-sm text-slate-600">
                      {latestBehavior.description ??
                        "No description provided."}
                    </p>

                    <p className="mt-3 text-xs text-slate-500">
                      Source: {latestBehavior.detection_source}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* APPEARANCE MONITORING */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-slate-900">
                  Appearance Monitoring
                </h2>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  Detection Not Active
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Review recorded color changes, unusual
                spots, and other visible abnormalities.
              </p>

              <div className="mt-5 rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-500">
                  Latest Database Record
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {appearanceError
                    ? "Unable to load records"
                    : latestAppearance
                      ? latestAppearance.abnormality_type ??
                        latestAppearance.appearance_status
                      : "No appearance records"}
                </p>

                {latestAppearance && !appearanceError && (
                  <>
                    <span
                      className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-medium ${statusStyle(
                        latestAppearance.appearance_status ===
                          "Possible Abnormality"
                      )}`}
                    >
                      {latestAppearance.appearance_status}
                    </span>

                    <p className="mt-3 text-sm text-slate-600">
                      {latestAppearance.description ??
                        "No description provided."}
                    </p>

                    <p className="mt-3 text-xs text-slate-500">
                      Source: {latestAppearance.detection_source}
                    </p>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* ==========================================
              BEHAVIOR HISTORY
          ========================================== */}
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">
              Behavior History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Recorded fish activity stored in MySQL.
            </p>

            {behaviorError ? (
              <p className="mt-6 text-sm text-red-600">
                Failed to load behavior history.
              </p>
            ) : behaviorLogs.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">
                No behavior records available.
              </p>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase text-slate-500">
                      <th className="px-3 py-3">Fish</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Behavior</th>
                      <th className="px-3 py-3">Source</th>
                      <th className="px-3 py-3">Detected At</th>
                    </tr>
                  </thead>

                  <tbody>
                    {behaviorLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-slate-100"
                      >
                        <td className="px-3 py-4">
                          {log.fish_name ?? "Unidentified"}
                        </td>

                        <td className="px-3 py-4">
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${statusStyle(
                              log.activity_status === "Abnormal"
                            )}`}
                          >
                            {log.activity_status}
                          </span>
                        </td>

                        <td className="px-3 py-4">
                          {log.behavior_type ?? "—"}
                        </td>

                        <td className="px-3 py-4">
                          {log.detection_source}
                        </td>

                        <td className="px-3 py-4">
                          {formatDate(log.detected_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ==========================================
              APPEARANCE HISTORY
          ========================================== */}
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">
              Appearance History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Recorded visible appearance observations
              stored in MySQL.
            </p>

            {appearanceError ? (
              <p className="mt-6 text-sm text-red-600">
                Failed to load appearance history.
              </p>
            ) : appearanceLogs.length === 0 ? (
              <div className="mt-6 rounded-lg bg-slate-50 p-6 text-center">
                <p className="text-sm font-medium text-slate-700">
                  No appearance observations yet
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Records will appear after observations
                  are saved to the database.
                </p>
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase text-slate-500">
                      <th className="px-3 py-3">Fish</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Abnormality</th>
                      <th className="px-3 py-3">Source</th>
                      <th className="px-3 py-3">Detected At</th>
                    </tr>
                  </thead>

                  <tbody>
                    {appearanceLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-slate-100"
                      >
                        <td className="px-3 py-4">
                          {log.fish_name ?? "Unidentified"}
                        </td>

                        <td className="px-3 py-4">
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${statusStyle(
                              log.appearance_status ===
                                "Possible Abnormality"
                            )}`}
                          >
                            {log.appearance_status}
                          </span>
                        </td>

                        <td className="px-3 py-4">
                          {log.abnormality_type ?? "—"}
                        </td>

                        <td className="px-3 py-4">
                          {log.detection_source}
                        </td>

                        <td className="px-3 py-4">
                          {formatDate(log.detected_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* SYSTEM NOTICE */}
          <p className="mt-6 text-xs text-slate-500">
            Note: Existing prototype records do not
            represent live camera detections. Automatic
            behavior and appearance analysis will require
            camera integration and validation.
          </p>
        </div>
      </main>
    </div>
  );
}
