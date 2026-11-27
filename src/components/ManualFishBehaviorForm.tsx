
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  saveManualFishBehavior,
  type FishProfileRecord,
} from "@/lib/api";

type Props = {
  fishProfiles: FishProfileRecord[];
};

export default function ManualFishBehaviorForm({
  fishProfiles,
}: Props) {
  const router = useRouter();

  const [fishId, setFishId] = useState("");
  const [activityStatus, setActivityStatus] = useState<
    "Normal" | "Abnormal"
  >("Normal");
  const [behaviorType, setBehaviorType] = useState("");
  const [description, setDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    const selectedFishId = Number(fishId);

    if (
      !Number.isSafeInteger(selectedFishId) ||
      !fishProfiles.some((fish) => fish.id === selectedFishId)
    ) {
      setErrorMessage("Please select a valid fish.");
      return;
    }

    if (!behaviorType.trim()) {
      setErrorMessage("Please enter a behavior type.");
      return;
    }

    setSaving(true);

    try {
      await saveManualFishBehavior({
        fish_id: selectedFishId,
        activity_status: activityStatus,
        behavior_type: behaviorType.trim(),
        description: description.trim(),
      });

      setSuccessMessage(
        "Manual fish behavior observation saved successfully."
      );

      setFishId("");
      setActivityStatus("Normal");
      setBehaviorType("");
      setDescription("");

      // Refresh server-rendered monitoring data
      router.refresh();
    } catch (error) {
      console.error(
        "Failed to save manual fish behavior:",
        error
      );

      setErrorMessage(
        "Unable to save observation. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="font-semibold text-slate-900">
          Manual Fish Behavior Observation
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Record observed swimming behavior for registered
          fish. These entries are manually recorded and
          are not automatic camera detections.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* FISH SELECTION */}
          <div>
            <label
              htmlFor="manual-fish-id"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Select Fish
            </label>

            <select
              id="manual-fish-id"
              value={fishId}
              onChange={(event) =>
                setFishId(event.target.value)
              }
              required
              disabled={saving || fishProfiles.length === 0}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900"
            >
              <option value="">Choose a fish</option>

              {fishProfiles.map((fish) => (
                <option key={fish.id} value={fish.id}>
                  {fish.fish_name} ({fish.species})
                </option>
              ))}
            </select>
          </div>

          {/* ACTIVITY STATUS */}
          <div>
            <label
              htmlFor="manual-activity-status"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Activity Status
            </label>

            <select
              id="manual-activity-status"
              value={activityStatus}
              onChange={(event) =>
                setActivityStatus(
                  event.target.value as "Normal" | "Abnormal"
                )
              }
              disabled={saving}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900"
            >
              <option value="Normal">Normal</option>
              <option value="Abnormal">Abnormal</option>
            </select>
          </div>
        </div>

        {/* BEHAVIOR TYPE */}
        <div>
          <label
            htmlFor="manual-behavior-type"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Behavior Type
          </label>

          <input
            id="manual-behavior-type"
            type="text"
            value={behaviorType}
            onChange={(event) =>
              setBehaviorType(event.target.value)
            }
            placeholder="e.g. Normal swimming, Erratic swimming"
            maxLength={100}
            required
            disabled={saving}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900"
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label
            htmlFor="manual-behavior-description"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Observation Description
          </label>

          <textarea
            id="manual-behavior-description"
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Describe the observed fish behavior..."
            rows={4}
            maxLength={5000}
            disabled={saving}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900"
          />
        </div>

        {/* FEEDBACK */}
        {successMessage && (
          <p
            role="status"
            className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700"
          >
            {successMessage}
          </p>
        )}

        {errorMessage && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || fishProfiles.length === 0}
          className="rounded-lg bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving Observation..." : "Save Observation"}
        </button>
      </form>
    </section>
  );
}
