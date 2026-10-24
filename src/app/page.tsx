import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  getWaterQualityReadings,
  type WaterQualityReading,
} from "@/lib/api";

export default async function Home() {
  let latestReading: WaterQualityReading | null = null;

  try {
    const readings = await getWaterQualityReadings();
    latestReading = readings[0] ?? null;
  } catch (error) {
    console.error("Failed to load water quality data:", error);
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex flex-1 flex-col">
        <Header />

        <div className="flex-1 bg-slate-50 p-8">
          {/* =========================
              WATER QUALITY OVERVIEW
          ========================== */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Water Quality Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current fishpond water conditions
            </p>
          </div>

          {/* Water Quality Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {/* Water Temperature */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Water Temperature
              </p>

              <div className="mt-3 flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {latestReading?.temperature ?? "--"}
                </span>
                <span className="mb-1 text-sm text-slate-500">°C</span>
              </div>

              <p className="mt-3 text-sm font-medium text-emerald-600">
                Normal
              </p>
            </div>

            {/* pH Level */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                pH Level
              </p>

              <div className="mt-3 flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {latestReading?.ph_level ?? "--"}
                </span>
                <span className="mb-1 text-sm text-slate-500">pH</span>
              </div>

              <p className="mt-3 text-sm font-medium text-emerald-600">
                Normal
              </p>
            </div>

            {/* Dissolved Oxygen */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Dissolved Oxygen
              </p>

              <div className="mt-3 flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {latestReading?.dissolved_oxygen ?? "--"}
                </span>
                <span className="mb-1 text-sm text-slate-500">
                  mg/L
                </span>
              </div>

              <p className="mt-3 text-sm font-medium text-emerald-600">
                Normal
              </p>
            </div>

            {/* Turbidity */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Turbidity
              </p>

              <div className="mt-3 flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {latestReading?.turbidity ?? "--"}
                </span>
                <span className="mb-1 text-sm text-slate-500">NTU</span>
              </div>

              <p className="mt-3 text-sm font-medium text-emerald-600">
                Normal
              </p>
            </div>

            {/* Water Level */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Water Level
              </p>

              <div className="mt-3 flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {latestReading?.water_level ?? "--"}
                </span>
                <span className="mb-1 text-sm text-slate-500">%</span>
              </div>

              <p className="mt-3 text-sm font-medium text-emerald-600">
                Normal
              </p>
            </div>
          </div>

          {/* =========================
              POND MONITORING
          ========================== */}
          <div className="mt-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Pond Monitoring
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Live fishpond camera and activity monitoring
              </p>
            </div>

            {/* Camera Preview */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex h-72 items-center justify-center bg-slate-900">
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-300">
                    Live Camera Feed
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    ESP32-CAM preview will appear here
                  </p>
                </div>
              </div>

              {/* Camera Status */}
              <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    ESP32-CAM
                  </p>

                  <p className="text-xs text-slate-500">
                    Pond Camera
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>

                  <span className="text-sm font-medium text-emerald-600">
                    Connected
                  </span>
                </div>
              </div>
            </div>

            {/* Fish Activity Status */}
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Fish Activity Status
                  </p>

                  <h3 className="mt-1 text-lg font-semibold text-slate-900">
                    Normal Activity
                  </h3>
                </div>

                <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                  Normal
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-500">
                No abnormal fish behavior detected.
              </p>
            </div>
          </div>

          {/* =========================
              EQUIPMENT STATUS
          ========================== */}
          <div className="mt-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Equipment Status
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current status of pond equipment and automation
              </p>
            </div>

            {/* Equipment Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {/* Aerator */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Aerator
                    </p>

                    <h3 className="mt-1 text-lg font-semibold text-slate-900">
                      Running
                    </h3>
                  </div>

                  <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                </div>

                <p className="mt-4 text-sm font-medium text-emerald-600">
                  ON
                </p>
              </div>

              {/* Water Pump */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Water Pump
                    </p>

                    <h3 className="mt-1 text-lg font-semibold text-slate-900">
                      Standby
                    </h3>
                  </div>

                  <span className="h-3 w-3 rounded-full bg-slate-400"></span>
                </div>

                <p className="mt-4 text-sm font-medium text-slate-500">
                  OFF
                </p>
              </div>

              {/* Inlet Valve */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Inlet Valve
                    </p>

                    <h3 className="mt-1 text-lg font-semibold text-slate-900">
                      Closed
                    </h3>
                  </div>

                  <span className="h-3 w-3 rounded-full bg-slate-400"></span>
                </div>

                <p className="mt-4 text-sm font-medium text-slate-500">
                  OFF
                </p>
              </div>

              {/* Outlet Valve */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Outlet Valve
                    </p>

                    <h3 className="mt-1 text-lg font-semibold text-slate-900">
                      Closed
                    </h3>
                  </div>

                  <span className="h-3 w-3 rounded-full bg-slate-400"></span>
                </div>

                <p className="mt-4 text-sm font-medium text-slate-500">
                  OFF
                </p>
              </div>

              {/* Automatic Feeder */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Automatic Feeder
                    </p>

                    <h3 className="mt-1 text-lg font-semibold text-slate-900">
                      Ready
                    </h3>
                  </div>

                  <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                </div>

                <p className="mt-4 text-sm font-medium text-emerald-600">
                  READY
                </p>
              </div>
            </div>
          </div>

          {/* =========================
              RECENT ALERTS
          ========================== */}
          <div className="mt-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Alerts
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest system notifications and water quality alerts
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                    <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      No Active Alerts
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      All monitored water parameters are currently within normal
                      prototype ranges.
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                  Normal
                </span>
              </div>
            </div>
          </div>

          {/* =========================
              FEEDING SUMMARY
          ========================== */}
          <div className="mt-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Feeding Summary
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Automatic fish feeding schedule
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Next Feeding */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Next Feeding
                </p>

                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  5:00 PM
                </h3>

                <p className="mt-2 text-sm font-medium text-cyan-600">
                  Scheduled
                </p>
              </div>

              {/* Last Feeding */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Last Feeding
                </p>

                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  8:00 AM
                </h3>

                <p className="mt-2 text-sm font-medium text-emerald-600">
                  Completed
                </p>
              </div>
            </div>
          </div>

          {/* =========================
              SYSTEM SUMMARY
          ========================== */}
          <div className="mt-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                System Summary
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current SMART Aqua Pond system status
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Overall System
                  </p>

                  <h3 className="mt-1 text-xl font-semibold text-slate-900">
                    Operating Normally
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Monitoring and prototype equipment systems are currently
                    operational.
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2 rounded-full bg-emerald-100 px-4 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>

                  <span className="text-sm font-medium text-emerald-700">
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}