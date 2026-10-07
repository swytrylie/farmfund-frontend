import { useState, useEffect } from "react";
import { Plus, Sprout } from "lucide-react";
import { authedRequest } from "../../api";

const STATUS_CONFIG = {
  planned: { label: "Planned", className: "bg-gray-100 text-gray-600" },
  planting: { label: "Planting", className: "bg-amber-100 text-amber-700" },
  growing: { label: "Growing", className: "bg-green-100 text-green-700" },
  harvested: { label: "Harvested", className: "bg-[#e2f5d8] text-emerald-800" },
  failed: { label: "Failed", className: "bg-red-100 text-red-700" },
};

const selectClass =
  "bg-gray-100 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30";

const peso = (n) => `₱${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

// Yield (expected vs. actual) AND real profitability are both trackable
// now — profitability is computed from any FinancialRecord genuinely
// linked to this specific cycle (via the optional farmingCycle field added
// to transactions), not a guess. A cycle with no linked transactions yet
// shows that honestly, rather than a fabricated number.
function FarmingCycleCard({ cycle, onUpdate }) {
  const status = STATUS_CONFIG[cycle.status] || STATUS_CONFIG.planned;
  const [isEditing, setIsEditing] = useState(false);
  const [newStatus, setNewStatus] = useState(cycle.status);
  const [actualYield, setActualYield] = useState(cycle.actualYieldKg ? String(cycle.actualYieldKg) : "");
  const [saving, setSaving] = useState(false);

  const [linkedRecords, setLinkedRecords] = useState(null);
  const [profitError, setProfitError] = useState("");

  useEffect(() => {
    let cancelled = false;
    authedRequest(`/api/financial-records?farmingCycle=${cycle._id}&limit=100`)
      .then((data) => {
        if (!cancelled) setLinkedRecords(data);
      })
      .catch((err) => {
        if (!cancelled) setProfitError(err.message || "Couldn't load profitability.");
      });
    return () => {
      cancelled = true;
    };
  }, [cycle._id]);

  const income = (linkedRecords || []).filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
  const expenses = (linkedRecords || []).filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  const profit = income - expenses;

  async function handleSave() {
    setSaving(true);
    try {
      const body = { status: newStatus };
      if (actualYield) body.actualYieldKg = Number(actualYield);
      await onUpdate(cycle._id, body);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  }

  const yieldProgress =
    cycle.expectedYieldKg && cycle.actualYieldKg
      ? Math.round((cycle.actualYieldKg / cycle.expectedYieldKg) * 100)
      : null;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-gray-900">{cycle.customCropName || cycle.crop?.name || "Unknown crop"}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Started {new Date(cycle.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => setIsEditing((v) => !v)}
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${status.className}`}
        >
          {status.label}
        </button>
      </div>

      {(cycle.expectedYieldKg || cycle.actualYieldKg) && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">
              {cycle.actualYieldKg ? `${cycle.actualYieldKg} kg actual` : "No actual yield yet"}
            </span>
            {cycle.expectedYieldKg && <span className="text-gray-500">{cycle.expectedYieldKg} kg expected</span>}
          </div>
          {yieldProgress !== null && (
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${yieldProgress >= 100 ? "bg-[#4f7331]" : "bg-amber-400"}`}
                style={{ width: `${Math.min(yieldProgress, 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {cycle.notes && <p className="mt-3 text-xs text-gray-500">{cycle.notes}</p>}

      <div className="mt-4 border-t border-gray-100 pt-3">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Profitability</p>
        {profitError ? (
          <p className="text-xs text-red-500">{profitError}</p>
        ) : linkedRecords === null ? (
          <p className="text-xs text-gray-400">Loading…</p>
        ) : linkedRecords.length === 0 ? (
          <p className="text-xs text-gray-400">
            No transactions linked to this crop yet — link one from Income & Expenses to see real numbers here.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-gray-400">Income</p>
              <p className="font-bold text-green-700">{peso(income)}</p>
            </div>
            <div>
              <p className="text-gray-400">Expenses</p>
              <p className="font-bold text-red-600">{peso(expenses)}</p>
            </div>
            <div>
              <p className="text-gray-400">Profit</p>
              <p className={`font-bold ${profit < 0 ? "text-red-600" : "text-amber-700"}`}>{peso(profit)}</p>
            </div>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
          <div>
            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Status</label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className={selectClass}>
              {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                <option key={val} value={val}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Actual Yield (kg)</label>
            <input
              type="text"
              inputMode="numeric"
              value={actualYield}
              onChange={(e) => setActualYield(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="0"
              className={selectClass}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#4f7331] text-white px-4 py-1.5 rounded-lg text-xs font-medium disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setIsEditing(false)} className="text-gray-500 text-xs font-medium">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Logs a new farming cycle — picks from real, shared Crop reference data
// (seeded by an admin), rather than typing a free-text crop name.
function NewCycleModal({ crops, onSave, onCancel }) {
  const [cropId, setCropId] = useState(crops[0]?._id || "");
  const [customCropName, setCustomCropName] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedYield, setExpectedYield] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // "Other Crop" is the shared fallback entry seeded for exactly this case —
  // picking it reveals a free-text field, since Crop is master data a
  // regular farmer can't add their own entries to directly.
  const selectedCrop = crops.find((c) => c._id === cropId);
  const isOtherCrop = selectedCrop?.name === "Other Crop";

  async function handleSave() {
    if (!cropId) {
      setError("Select a crop.");
      return;
    }
    if (isOtherCrop && !customCropName.trim()) {
      setError("Enter what you're actually growing.");
      return;
    }
    if (!startDate) {
      setError("Enter a start date.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        crop: cropId,
        customCropName: isOtherCrop ? customCropName.trim() : undefined,
        startDate,
        expectedYieldKg: expectedYield ? Number(expectedYield) : undefined,
        notes: notes.trim() || undefined,
      });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="bg-black/40 backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl z-10" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-800">Log a Crop</h3>
        <p className="text-sm text-gray-500 mt-0.5">Start tracking a new planting cycle.</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Crop *</label>
            {crops.length === 0 ? (
              <p className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
                No crops exist in the system yet — ask an admin to add some first.
              </p>
            ) : (
              <select value={cropId} onChange={(e) => setCropId(e.target.value)} className={selectClass}>
                {crops.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}{c.variety ? ` (${c.variety})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {isOtherCrop && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">What are you growing? *</label>
              <input
                type="text"
                value={customCropName}
                onChange={(e) => setCustomCropName(e.target.value.slice(0, 100))}
                placeholder="e.g., Dragonfruit"
                className={selectClass}
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Start Date *</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={selectClass} />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Expected Yield (kg, optional)</label>
            <input
              type="text"
              inputMode="numeric"
              value={expectedYield}
              onChange={(e) => setExpectedYield(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="0"
              className={selectClass}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 300))}
              maxLength={300}
              className="bg-gray-100 rounded-xl p-4 text-sm w-full h-20 resize-none focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onCancel} className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-xl text-sm font-medium transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || crops.length === 0}
            className="bg-[#5bc252] hover:bg-[#4d9e45] text-white px-8 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FarmSetupPrompt() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm text-center max-w-md mx-auto">
      <h3 className="font-bold text-gray-900 text-lg">No farm set up yet</h3>
      <p className="mt-2 text-sm text-gray-500">
        Crop tracking belongs to a farm. Set one up from Income & Expenses to get started.
      </p>
    </div>
  );
}

export default function CropLivestock() {
  const [category, setCategory] = useState("crops");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [hasFarm, setHasFarm] = useState(true);
  const [fieldId, setFieldId] = useState(null);
  const [crops, setCrops] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [isNewCycleOpen, setIsNewCycleOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const farms = await authedRequest("/api/farms");
        if (cancelled) return;
        if (farms.length === 0) {
          setHasFarm(false);
          setLoading(false);
          return;
        }
        const farmId = farms[0]._id;

        // Fields are implicitly scoped under the farm — no separate setup
        // step. If none exist yet, one is created silently here.
        let fields = await authedRequest(`/api/fields?farm=${farmId}`);
        if (cancelled) return;
        let currentField = fields[0];
        if (!currentField) {
          currentField = await authedRequest("/api/fields", {
            method: "POST",
            body: { farm: farmId, name: "Main Field" },
          });
          if (cancelled) return;
        }
        setFieldId(currentField._id);

        const [cropsData, cyclesData] = await Promise.all([
          authedRequest("/api/crops?limit=100"),
          authedRequest(`/api/farming-cycles?field=${currentField._id}&limit=100`),
        ]);
        if (cancelled) return;
        setCrops(cropsData);
        setCycles(cyclesData);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Failed to load your data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleNewCycle(body) {
    const newCycle = await authedRequest("/api/farming-cycles", {
      method: "POST",
      body: { field: fieldId, ...body },
    });
    // The create response doesn't populate crop — merge in what we already
    // know locally so the card shows the crop name immediately, without a
    // second round-trip just to re-fetch the same thing.
    const cropInfo = crops.find((c) => c._id === body.crop);
    setCycles((prev) => [{ ...newCycle, crop: cropInfo }, ...prev]);
    setIsNewCycleOpen(false);
  }

  async function handleUpdateCycle(cycleId, body) {
    const updated = await authedRequest(`/api/farming-cycles/${cycleId}`, {
      method: "PATCH",
      body,
    });
    setCycles((prev) => prev.map((c) => (c._id === cycleId ? { ...c, ...updated } : c)));
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Crop / Livestock</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">Loading…</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Crop / Livestock</h2>
        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">
          {loadError}
        </div>
      </div>
    );
  }

  if (!hasFarm) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Crop / Livestock</h2>
        <FarmSetupPrompt />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Crop / Livestock</h2>
          <p className="mt-1 text-gray-500">Track planting cycles and yield</p>
        </div>
        {category === "crops" && (
          <button
            onClick={() => setIsNewCycleOpen(true)}
            className="mt-12 bg-[#3f6238] hover:bg-[#34512e] text-white px-4 py-2 rounded-lg flex items-center gap-1.5 text-sm font-medium shadow-sm transition-colors"
          >
            <Plus size={16} /> Log a Crop
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setCategory("crops")}
          className={`rounded-full px-6 py-1.5 text-xs transition-colors ${
            category === "crops" ? "bg-[#7ca357] text-white font-semibold" : "bg-[#608044] text-white"
          }`}
        >
          Crops
        </button>
        <button
          onClick={() => setCategory("livestock")}
          className={`rounded-full px-6 py-1.5 text-xs transition-colors ${
            category === "livestock" ? "bg-[#7ca357] text-white font-semibold" : "bg-[#608044] text-white"
          }`}
        >
          Livestock
        </button>
      </div>

      {category === "livestock" ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm text-center flex flex-col items-center gap-2">
          <Sprout size={24} className="text-gray-300" />
          <p className="text-gray-400 text-sm">
            Livestock tracking isn't available yet — only crop tracking is connected right now.
          </p>
        </div>
      ) : cycles.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm text-center">
          <p className="text-gray-400 text-sm">
            No crops logged yet — click "Log a Crop" to start tracking your first planting cycle.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {cycles.map((cycle) => (
            <FarmingCycleCard key={cycle._id} cycle={cycle} onUpdate={handleUpdateCycle} />
          ))}
        </div>
      )}

      {isNewCycleOpen && (
        <NewCycleModal crops={crops} onSave={handleNewCycle} onCancel={() => setIsNewCycleOpen(false)} />
      )}
    </div>
  );
}