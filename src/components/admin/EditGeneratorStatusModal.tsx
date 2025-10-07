"use client";

import React, { useMemo, useState } from "react";
import { httpsCallable, getFunctions } from "firebase/functions";
import app from "../../firebaseConfig";

type StatusOption = "Active" | "Under Repair" | "Unusable";

interface EditGeneratorStatusModalProps {
  open: boolean;
  onClose: () => void;
  generatorId: string;
  initialStatus?: StatusOption;
  initialExtractedParts?: string[];
}

export default function EditGeneratorStatusModal({
  open,
  onClose,
  generatorId,
  initialStatus = "Active",
  initialExtractedParts = [],
}: EditGeneratorStatusModalProps) {
  const functions = useMemo(() => getFunctions(app(), "us-central1"), []);
  const [status, setStatus] = useState<StatusOption>(initialStatus);
  const [parts, setParts] = useState<string[]>(initialExtractedParts);
  const [newPart, setNewPart] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const addPart = () => {
    const v = newPart.trim();
    if (!v) return;
    setParts((p) => [...p, v]);
    setNewPart("");
  };

  const removePart = (idx: number) => {
    setParts((p) => p.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const setStatusFn = httpsCallable(functions, "setGeneratorStatus");
      await setStatusFn({ id: generatorId, status });

      const updateFn = httpsCallable(functions, "updateGenerator");
      if (status === "Unusable") {
        await updateFn({ id: generatorId, extracted_parts: parts });
      } else {
        // Clear extracted parts when moving away from Unusable
        await updateFn({ id: generatorId, extracted_parts: [] });
      }

      onClose();
    } catch (e: unknown) {
      setError(String((e as Error)?.message || "Failed to update status"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Edit Generator Status</h2>

        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Update Status</label>
            <select
              className="border rounded-md px-3 py-2 bg-gray-100 border border-blue-100 focus:ring focus:ring-blue-200"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusOption)}
            >
              <option value="Active">Active</option>
              <option value="Under Repair">Under Repair</option>
              <option value="Unusable">Unusable</option>
            </select>
          </div>

          {status === "Unusable" && (
            <div className="flex flex-col">
              <label className="mb-1 font-medium text-gray-700">Extracted Parts</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newPart}
                  onChange={(e) => setNewPart(e.target.value)}
                  placeholder="Add part name"
                  className="flex-1 border rounded-md px-3 py-2 bg-gray-100 border border-blue-100 focus:ring focus:ring-blue-200"
                />
                <button
                  type="button"
                  onClick={addPart}
                  className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              {parts.length === 0 ? (
                <p className="text-sm text-gray-500">No extracted parts added.</p>
              ) : (
                <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
                  {parts.map((p, idx) => (
                    <li key={`${p}-${idx}`} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="text-gray-800">{p}</span>
                      <button
                        type="button"
                        onClick={() => removePart(idx)}
                        className="text-red-600 hover:text-red-700"
                        aria-label={`Remove ${p}`}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            className="px-4 py-2 rounded-md bg-gray-200 text-gray-700"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

