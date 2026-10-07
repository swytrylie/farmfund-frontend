import { useState, useEffect } from "react";
import { Plus, Pencil, AlertTriangle, Calendar } from "lucide-react";
import { authedRequest } from "../../api";

const peso = (n) => `₱${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

// Formats a raw digit string with thousand separators as you type — e.g.
// "50000" displays as "50,000". The digit-only value (no commas) is what's
// actually stored in state and sent to the backend; this only affects
// what's shown inside the input box itself.
function formatLiveAmount(digitsOnly) {
  if (!digitsOnly) return "";
  return Number(digitsOnly).toLocaleString("en-US");
}

function AdjustAllocationPanel({ currentAmount, onSave, onCancel }) {
  const [digits, setDigits] = useState(String(currentAmount));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const overLimit = Number(digits) > 500000;

  async function handleSave() {
    const numeric = Number(digits);
    if (!numeric || numeric <= 0 || numeric > 500000) return;
    setSaving(true);
    setError("");
    try {
      await onSave(numeric);
      // On success the parent closes this panel entirely, so there's
      // nothing left here to reset — only the failure path needs to turn
      // "Saving…" back off and show what went wrong.
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="bg-[#f8fafc] border border-gray-200 rounded-2xl p-4 mt-3 shadow-inner">
      <label className="text-xs font-semibold text-gray-700 block mb-1">Adjust Allocation (PHP)</label>
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium pointer-events-none">₱</span>
          <input
            type="text"
            inputMode="numeric"
            value={formatLiveAmount(digits)}
            onChange={(e) => setDigits(e.target.value.replace(/[^\d]/g, ""))}
            className={`bg-white border rounded-full pl-7 pr-4 py-1.5 text-xs text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
              overLimit ? "border-red-300 ring-2 ring-red-400" : "border-gray-300"
            }`}
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving || overLimit}
          className="bg-[#5bc252] hover:bg-[#42BD41] text-white px-5 py-1.5 rounded-full text-xs font-semibold cursor-pointer shadow-sm transition-colors shrink-0 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xs font-medium shrink-0">
          Cancel
        </button>
      </div>
      <p className={`mt-1 text-[11px] ${overLimit ? "text-red-500 font-semibold" : "text-gray-400"}`}>
        {digits ? peso(Number(digits)) : "₱0.00"} / ₱500,000.00 max
        {overLimit && " — over the limit"}
      </p>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// actualSpent is REAL — computed by summing matching FinancialRecord
// expenses within this budget's own period, not invented. There's no
// backend endpoint that calculates this directly, so it's derived
// client-side from two things that are both genuinely real: the budget's
// allocation, and the farm's real transaction history.
function BudgetCategoryCard({ item, isEditing, onEditToggle, onSaveAllocation, periodLabel }) {
  const { categoryName, allocatedAmount, actualSpent } = item;
  const percent = allocatedAmount > 0 ? Math.round((actualSpent / allocatedAmount) * 100) : 0;
  const overBudget = actualSpent > allocatedAmount;
  const barColor = overBudget ? "bg-[#b83838]" : "bg-[#4f7331]";
  const remainingLabel = overBudget
    ? `Over by ${peso(actualSpent - allocatedAmount)}`
    : `${peso(allocatedAmount - actualSpent)} remaining`;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {overBudget && <AlertTriangle size={16} className="text-red-600 shrink-0" />}
          <h3 className="font-bold text-gray-900">{categoryName}</h3>
        </div>
        <button
          onClick={onEditToggle}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={`Edit ${categoryName}`}
        >
          <Pencil size={15} />
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-0.5">{periodLabel}</p>

      <div className="mt-4 w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className={overBudget ? "text-red-600 font-semibold" : "text-gray-600"}>
          Spent: {peso(actualSpent)}
        </span>
        <span className={`font-semibold ${overBudget ? "text-red-600" : "text-gray-700"}`}>{percent}%</span>
        <span className="text-gray-600">Budget: {peso(allocatedAmount)}</span>
      </div>

      <p className={`mt-2 text-xs font-medium ${overBudget ? "text-red-600" : "text-gray-500"}`}>
        {remainingLabel}
      </p>

      {isEditing && (
        <AdjustAllocationPanel
          currentAmount={allocatedAmount}
          onSave={onSaveAllocation}
          onCancel={onEditToggle}
        />
      )}
    </div>
  );
}

const selectClass =
  "bg-gray-100 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30";

// Adds a real category allocation to the current budget — picks from real
// FinancialCategory options not already allocated in this budget, rather
// than typing a free-text name, since the backend needs a valid category
// reference to save this.
function NewAllocationModal({ availableCategories, allCategories, onSave, onCancel }) {
  const [categoryId, setCategoryId] = useState(availableCategories[0]?._id || "");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const numericAmount = parseFloat(amount);
    if (!categoryId) {
      setError("Select a category.");
      return;
    }
    if (!numericAmount || numericAmount <= 0 || numericAmount > 500000) {
      setError("Enter an amount between ₱1 and ₱500,000.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(categoryId, numericAmount);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="bg-black/40 backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl z-10" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-800">New Budget Category</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Allocate part of your budget to a spending category.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Category *</label>
            {availableCategories.length === 0 ? (
              <p className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
                {allCategories.length === 0
                  ? "No expense categories exist yet — add one in the database first."
                  : "Every expense category is already allocated in this budget."}
              </p>
            ) : (
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={selectClass}>
                {availableCategories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Budget Amount (PHP) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">₱</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatLiveAmount(amount)}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="0"
                className={`${selectClass} pl-8 ${
                  Number(amount) > 500000 ? "ring-2 ring-red-400 border-red-300" : ""
                }`}
              />
            </div>
            <p className={`mt-1 text-[11px] ${Number(amount) > 500000 ? "text-red-500 font-semibold" : "text-gray-400"}`}>
              {amount ? peso(Number(amount)) : "₱0.00"} / ₱500,000.00 max
              {Number(amount) > 500000 && " — over the limit"}
            </p>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onCancel} className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-xl text-sm font-medium transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || availableCategories.length === 0 || Number(amount) > 500000}
            className="bg-[#5bc252] hover:bg-[#4d9e45] text-white px-8 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Shown when the farm has no budget for a period yet — financial categories
// need a parent Budget document to belong to.
function NewBudgetPrompt({ onCreated, farmId }) {
  const [name, setName] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    const total = parseFloat(totalAmount);
    if (!name.trim()) {
      setError("Enter a name for this budget.");
      return;
    }
    if (!periodStart || !periodEnd || new Date(periodEnd) <= new Date(periodStart)) {
      setError("Enter a valid date range — the end date must be after the start date.");
      return;
    }
    if (!total || total <= 0 || total > 500000) {
      setError("Enter a total amount between ₱1 and ₱500,000.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const budget = await authedRequest("/api/budgets", {
        method: "POST",
        body: { farm: farmId, name: name.trim(), periodStart, periodEnd, totalAmount: total },
      });
      onCreated(budget);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm max-w-lg mx-auto">
      <h3 className="font-bold text-gray-900 text-lg text-center">Set up your budget</h3>
      <p className="mt-2 text-sm text-gray-500 text-center">
        Create a budget for a season or period, then allocate it across spending categories.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Budget Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Wet Season 2026"
            className={selectClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Start Date *</label>
            <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className={selectClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">End Date *</label>
            <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className={selectClass} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Total Budget (PHP) *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">₱</span>
            <input
              type="text"
              inputMode="numeric"
              value={formatLiveAmount(totalAmount)}
              onChange={(e) => setTotalAmount(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="0"
              className={`${selectClass} pl-8 ${
                Number(totalAmount) > 500000 ? "ring-2 ring-red-400 border-red-300" : ""
              }`}
            />
          </div>
          <p className={`mt-1 text-[11px] ${Number(totalAmount) > 500000 ? "text-red-500 font-semibold" : "text-gray-400"}`}>
            {totalAmount ? peso(Number(totalAmount)) : "₱0.00"} / ₱500,000.00 max
            {Number(totalAmount) > 500000 && " — over the limit"}
          </p>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      <button
        onClick={handleCreate}
        disabled={saving || Number(totalAmount) > 500000}
        className="mt-5 w-full bg-[#3f6238] hover:bg-[#34512e] text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
      >
        {saving ? "Creating…" : "Create Budget"}
      </button>
    </div>
  );
}

function FarmSetupPrompt() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm text-center max-w-md mx-auto">
      <h3 className="font-bold text-gray-900 text-lg">No farm set up yet</h3>
      <p className="mt-2 text-sm text-gray-500">
        Budgets belong to a farm. Set one up from Income & Expenses to get started.
      </p>
    </div>
  );
}

export default function BudgetManagement() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [hasFarm, setHasFarm] = useState(true);
  const [farmId, setFarmId] = useState(null);
  const [budget, setBudget] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [actualSpentByCategory, setActualSpentByCategory] = useState({});
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [isNewAllocationOpen, setIsNewAllocationOpen] = useState(false);

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
        setFarmId(farms[0]._id);

        const [budgets, categories] = await Promise.all([
          authedRequest(`/api/budgets?farm=${farms[0]._id}`),
          authedRequest("/api/financial-categories?type=expense"),
        ]);
        if (cancelled) return;
        setAllCategories(categories);

        if (budgets.length === 0) {
          setLoading(false);
          return;
        }
        const currentBudget = budgets[0];
        setBudget(currentBudget);

        // Real actual-spent per category: sum matching FinancialRecord
        // expenses within this budget's own date range — not invented.
        const records = await authedRequest(
          `/api/financial-records?farm=${farms[0]._id}&type=expense&startDate=${currentBudget.periodStart}&endDate=${currentBudget.periodEnd}&limit=100`
        );
        if (cancelled) return;
        const spentMap = {};
        for (const r of records) {
          const catId = r.category?._id || r.category;
          spentMap[catId] = (spentMap[catId] || 0) + r.amount;
        }
        setActualSpentByCategory(spentMap);
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

  async function refetchSpending(currentBudget) {
    const records = await authedRequest(
      `/api/financial-records?farm=${farmId}&type=expense&startDate=${currentBudget.periodStart}&endDate=${currentBudget.periodEnd}&limit=100`
    );
    const spentMap = {};
    for (const r of records) {
      const catId = r.category?._id || r.category;
      spentMap[catId] = (spentMap[catId] || 0) + r.amount;
    }
    setActualSpentByCategory(spentMap);
  }

  async function handleBudgetCreated(newBudget) {
    setBudget(newBudget);
    await refetchSpending(newBudget);
  }

  async function handleAddAllocation(categoryId, allocatedAmount) {
    // Existing items come back from the backend with `category` already
    // populated as a full object ({ _id, name, type }), not a plain id —
    // normalized back to just the id here before resending, since the
    // backend's validator expects a plain Mongo id for every entry, not
    // the whole populated object.
    const existingCategories = (budget.categories || []).map((item) => ({
      category: item.category?._id || item.category,
      allocatedAmount: item.allocatedAmount,
    }));
    const newCategories = [...existingCategories, { category: categoryId, allocatedAmount }];
    const updated = await authedRequest(`/api/budgets/${budget._id}`, {
      method: "PATCH",
      body: { categories: newCategories },
    });
    setBudget(updated);
    setIsNewAllocationOpen(false);
  }

  async function handleUpdateAllocation(categoryId, newAmount) {
    // Same normalization as handleAddAllocation — item.category comes back
    // from the backend as a populated object, not a plain id, so it has to
    // be flattened back to just the id before resending, every time, not
    // only for the one entry actually being changed.
    const newCategories = budget.categories.map((item) => {
      const itemCatId = item.category?._id || item.category;
      return {
        category: itemCatId,
        allocatedAmount: itemCatId === categoryId ? newAmount : item.allocatedAmount,
      };
    });
    const updated = await authedRequest(`/api/budgets/${budget._id}`, {
      method: "PATCH",
      body: { categories: newCategories },
    });
    setBudget(updated);
    setEditingCategoryId(null);
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Budget Management</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">Loading…</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Budget Management</h2>
        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">
          {loadError}
        </div>
      </div>
    );
  }

  if (!hasFarm) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Budget Management</h2>
        <FarmSetupPrompt />
      </div>
    );
  }

  if (!budget) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Budget Management</h2>
        <p className="mt-1 text-gray-500 mb-8">Plan and track your farm spending by category</p>
        <NewBudgetPrompt farmId={farmId} onCreated={handleBudgetCreated} />
      </div>
    );
  }

  const periodLabel = `${new Date(budget.periodStart).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} - ${new Date(budget.periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const items = (budget.categories || []).map((item) => {
    const categoryId = item.category?._id || item.category;
    const categoryName = item.category?.name || allCategories.find((c) => c._id === categoryId)?.name || "Unknown";
    return {
      categoryId,
      categoryName,
      allocatedAmount: item.allocatedAmount,
      actualSpent: actualSpentByCategory[categoryId] || 0,
    };
  });

  const totalAllocated = items.reduce((sum, i) => sum + i.allocatedAmount, 0);
  const totalActualSpent = items.reduce((sum, i) => sum + i.actualSpent, 0);
  const remaining = budget.totalAmount - totalActualSpent;
  const overBudgetItems = items.filter((i) => i.actualSpent > i.allocatedAmount);

  const allocatedCategoryIds = new Set(items.map((i) => i.categoryId));
  const availableCategories = allCategories.filter((c) => !allocatedCategoryIds.has(c._id));

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Budget Management</h2>
          <p className="mt-1 text-gray-500">{budget.name} · {periodLabel}</p>
        </div>
        <button
          onClick={() => setIsNewAllocationOpen(true)}
          className="mt-12 bg-[#3f6238] hover:bg-[#34512e] text-white px-4 py-2 rounded-lg flex items-center gap-1.5 text-sm font-medium shadow-sm transition-colors"
        >
          <Plus size={16} /> New Budget Category
        </button>
      </div>

      {overBudgetItems.length > 0 && (
        <div className="mt-6 bg-[#fdf2f2] border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-4 shadow-sm">
          <AlertTriangle size={28} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-700">Over-budget alert</p>
            <p className="text-gray-700 text-sm mt-0.5">
              {overBudgetItems.map((i) => i.categoryName).join(", ")} {overBudgetItems.length === 1 ? "has" : "have"} exceeded its allocated budget. Consider reviewing spending or adjusting allocations.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-400">Total Budget</p>
          <p className="mt-1 text-2xl font-bold text-[#2d5220]">{peso(budget.totalAmount)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-400">Allocated</p>
          <p className="mt-1 text-2xl font-bold text-gray-700">{peso(totalAllocated)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-400">Total Spent</p>
          <p className="mt-1 text-2xl font-bold text-[#b83838]">{peso(totalActualSpent)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-400">Remaining</p>
          <p className={`mt-1 text-2xl font-bold ${remaining < 0 ? "text-red-600" : "text-[#be8238]"}`}>{peso(remaining)}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm text-center">
          <p className="text-gray-400 text-sm">
            No categories allocated yet — click "New Budget Category" to start planning.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((item) => (
            <BudgetCategoryCard
              key={item.categoryId}
              item={item}
              periodLabel={periodLabel}
              isEditing={editingCategoryId === item.categoryId}
              onEditToggle={() => setEditingCategoryId((cur) => (cur === item.categoryId ? null : item.categoryId))}
              onSaveAllocation={(amt) => handleUpdateAllocation(item.categoryId, amt)}
            />
          ))}
        </div>
      )}

      {isNewAllocationOpen && (
        <NewAllocationModal
          availableCategories={availableCategories}
          allCategories={allCategories}
          onSave={handleAddAllocation}
          onCancel={() => setIsNewAllocationOpen(false)}
        />
      )}
    </div>
  );
}