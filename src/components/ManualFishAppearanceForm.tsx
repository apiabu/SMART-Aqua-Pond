
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  saveManualFishAppearance,
  type FishProfileRecord,
} from "@/lib/api";

type Props = {
  fishProfiles: FishProfileRecord[];
};

export default function ManualFishAppearanceForm({
  fishProfiles,
}: Props) {
  const router = useRouter();

  const [fishId, setFishId] = useState("");
  const [appearanceStatus, setAppearanceStatus] = useState<
    "Normal" | "Possible Abnormality"
  >("Normal");
  const [abnormalityType, setAbnormalityType] = useState("");
  const [description, setDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    if (
      appearanceStatus === "Possible Abnormality" &&
      !abnormalityType.trim()
    ) {
      setErrorMessage("Please specify the visible abnormality.");
      return;
    }

    setSaving(true);

    try {
      await saveManualFishAppearance({
        fish_id: selectedFishId,
        appearance_status: appearanceStatus,
        abnormality_type:
          appearanceStatus === "Possible Abnormality"
            ? abnormalityType.trim()
            : null,
        description: description.trim(),
      });

      setSuccessMessage(
        "Manual fish appearance observation saved successfully."
      );

      setFishId("");
      setAppearanceStatus("Normal");
      setAbnormalityType("");
      setDescription("");

      router.refresh();
    } catch (error) {
      console.error("Failed to save appearance observation:", error);
      setErrorMessage(
        "Unable to save appearance observation. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-slate-900">
        Manual Fish Appearance Observation
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Record visible changes in fish color, spots, skin, or fins.
        These are manual observations, not automatic camera detections
        or confirmed disease diagnoses.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="appearance-fish-id"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Select Fish
            </label>

            <select
              id="appearance-fish-id"
              value={fishId}
              onChange={(event) => setFishId(event.target.value)}
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

          <div>
            <label
              htmlFor="appearance-status"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Appearance Status
            </label>

            <select
              id="appearance-status"
              value={appearanceStatus}
              onChange={(event) =>
                setAppearanceStatus(
                  event.target.value as
                    | "Normal"
                    | "Possible Abnormality"
                )
              }
              disabled={saving}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900"
            >
              <option value="Normal">Normal</option>
              <option value="Possible Abnormality">
                Possible Abnormality
              </option>
            </select>
          </div>
        </div>

        {appearanceStatus === "Possible Abnormality" && (
          <div>
            <label
              htmlFor="appearance-abnormality"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Visible Abnormality
            </label>

            <input
              id="appearance-abnormality"
              type="text"
              value={abnormalityType}
              onChange={(event) =>
                setAbnormalityType(event.target.value)
              }
              placeholder="e.g. Unusual white spots, discoloration"
              maxLength={100}
              required
              disabled={saving}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="appearance-description"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Observation Description
          </label>

          <textarea
            id="appearance-description"
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Describe any observed color changes, spots, or other visible conditions..."
            rows={4}
            maxLength={5000}
            disabled={saving}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900"
          />
        </div>

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
          {saving ? "Saving Observation..." : "Save Appearance Observation"}
        </button>
      </form>
    </section>
  );
}
