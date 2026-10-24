import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  getWaterQualityReadings,
  type WaterQualityReading,
} from "@/lib/api";

export default async function LiveMonitoringPage() {
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
          <h1 className="text-2xl font-bold text-slate-900">
            Live Monitoring
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Real-time monitoring of fishpond water quality parameters.
          </p>

          {/* Monitoring Status */}
          <div className="mt-4 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>

            <span className="text-sm font-medium text-slate-700">
              Monitoring Active
            </span>

            <span className="text-sm text-slate-400">
              • Latest stored reading
            </span>

            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              Prototype Data
            </span>
          </div>

          {/* Water Quality Monitor Cards */}
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Water Temperature Monitor */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Water Temperature
              </p>

              <div className="mt-3 flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {latestReading?.temperature ?? "--"}
                </span>

                <span className="mb-1 text-sm text-slate-500">
                  °C
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>

                <span className="text-sm font-medium text-emerald-600">
                  Normal
                </span>
              </div>

              <p className="mt-3 text-xs text-slate-400">
                Prototype acceptable range: 25–30 °C
              </p>
            </div>

            {/* pH Monitor */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                pH Level
              </p>

              <div className="mt-3 flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {latestReading?.ph_level ?? "--"}
                </span>

                <span className="mb-1 text-sm text-slate-500">
                  pH
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>

                <span className="text-sm font-medium text-emerald-600">
                  Normal
                </span>
              </div>

              <p className="mt-3 text-xs text-slate-400">
                Prototype acceptable range: 6.5–8.5 pH
              </p>
            </div>

            {/* Dissolved Oxygen Monitor */}
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

              <div className="mt-4 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>

                <span className="text-sm font-medium text-emerald-600">
                  Normal
                </span>
              </div>

              <p className="mt-3 text-xs text-slate-400">
                Prototype acceptable range: 5.0–8.0 mg/L
              </p>
            </div>

            {/* Turbidity Monitor */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Turbidity
              </p>

              <div className="mt-3 flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {latestReading?.turbidity ?? "--"}
                </span>

                <span className="mb-1 text-sm text-slate-500">
                  NTU
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>

                <span className="text-sm font-medium text-emerald-600">
                  Normal
                </span>
              </div>

              <p className="mt-3 text-xs text-slate-400">
                Prototype acceptable range: 0–5 NTU
              </p>
            </div>

            {/* Water Level Monitor */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Water Level
              </p>

              <div className="mt-3 flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {latestReading?.water_level ?? "--"}
                </span>

                <span className="mb-1 text-sm text-slate-500">
                  %
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>

                <span className="text-sm font-medium text-emerald-600">
                  Normal
                </span>
              </div>

              <p className="mt-3 text-xs text-slate-400">
                Prototype acceptable range: 70–100%
              </p>
            </div>
          </div>

          {/* Sensor Connection Status */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Sensor Connection
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Arduino Mega 2560 water monitoring controller
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>

                <span className="text-sm font-medium text-amber-700">
                  Prototype
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Current readings are database test data. Arduino sensor hardware
              has not yet been integrated.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}