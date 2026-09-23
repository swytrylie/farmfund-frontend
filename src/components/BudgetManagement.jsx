import { useState } from "react";
import { Plus, Pencil, AlertTriangle, Calendar } from "lucide-react";

// ---- KPI summary data ----
const KPI_CARDS = [
  { label: "Total Budgeted", value: "₱247,000", valueColor: "text-[#2d5220]" },
  { label: "Total Spent", value: "₱205,200", valueColor: "text-[#b83838]" },
  { label: "Remaining", value: "₱41,800", valueColor: "text-[#be8238]" },
];

function parseCurrency(str) {
  return parseFloat(String(str).replace(/[₱,]/g, "")) || 0;
}
function formatCurrency(num) {
  return `₱${Math.round(num).toLocaleString("en-US")}`;
}

// ---- Initial budget category data ----
// Note: Fertilizers & Chemicals' original 91% didn't reconcile with its
// ₱54,700 spent / ₱100,000 budget (that's 54.7%), nor with the stated
// ₱5,300 remaining. The seed values below are used as given; editing any
// card's budget now recomputes percent/remaining consistently going forward.
const INITIAL_CATEGORIES = [
  {
    id: "seed-planting",
    name: "Seed & Planting",
    normalBarColor: "bg-[#4f7331]",
    spent: "₱82,000",
    budget: "₱100,000",
  },
  {
    id: "fertilizers-chemicals",
    name: "Fertilizers & Chemicals",
    normalBarColor: "bg-[#c28e46]",
    spent: "₱54,700",
    budget: "₱100,000",
  },
  {
    id: "labour",
    name: "Labour",
    normalBarColor: "bg-[#4f7331]",
    spent: "₱24,000",
    budget: "₱30,000",
  },
  {
    id: "equipment-maintenance",
    name: "Equipments and Maintenance",
    normalBarColor: "bg-[#4f7331]",
    spent: "₱9,800",
    budget: "₱20,000",
  },
  {
    id: "transport-logistics",
    name: "Transports & Logistics",
    normalBarColor: "bg-[#4f7331]",
    spent: "₱7,300",
    budget: "₱12,000",
  },
  {
    id: "irrigation",
    name: "Irrigation",
    normalBarColor: "bg-[#4f7331]",
    spent: "₱27,400",
    budget: "₱25,000",
  },
];

function AdjustBudgetPanel({ currentBudget, onSave }) {
  const [value, setValue] = useState(
    parseCurrency(currentBudget).toLocaleString("en-US")
  );

  function handleSave() {
    const numeric = parseCurrency(value);
    if (numeric > 0) onSave(numeric);
  }

  return (
    <div className="bg-[#f8fafc] border border-gray-200 rounded-2xl p-4 mt-3 flex items-center justify-between gap-3 shadow-inner">
      <div className="flex-1">
        <label className="text-xs font-semibold text-gray-700 block mb-1">
          Adjust Budget
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="bg-white border border-gray-300 rounded-full px-4 py-1.5 text-xs text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
        />
      </div>
      <button
        onClick={handleSave}
        className="bg-[#5bc252] hover:bg-[#42BD41] text-white px-5 py-1.5 rounded-full text-xs font-semibold cursor-pointer shadow-sm transition-colors shrink-0 self-end"
      >
        Save
      </button>
    </div>
  );
}

function BudgetCategoryCard({ category, isEditing, onEditToggle, onSaveBudget }) {
  const { name, normalBarColor, spent, budget } = category;

  const spentNum = parseCurrency(spent);
  const budgetNum = parseCurrency(budget);
  const percent = budgetNum > 0 ? Math.round((spentNum / budgetNum) * 100) : 0;
  const overBudget = spentNum > budgetNum;
  const barColor = overBudget ? "bg-[#b83838]" : normalBarColor;
  const remainingLabel = overBudget
    ? `Over by ${formatCurrency(spentNum - budgetNum)}`
    : `${formatCurrency(budgetNum - spentNum)} remaining`;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {overBudget && (
            <AlertTriangle size={16} className="text-red-600 shrink-0" />
          )}
          <h3 className="font-bold text-gray-900">{name}</h3>
        </div>
        <button
          onClick={onEditToggle}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={`Edit ${name}`}
        >
          <Pencil size={15} />
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-0.5">Long Rains 2026</p>

      {/* Progress bar */}
      <div className="mt-4 w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>

      {/* Spent | Percentage | Budget row */}
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className={overBudget ? "text-red-600 font-semibold" : "text-gray-600"}>
          Spent: {spent}
        </span>
        <span
          className={`font-semibold ${
            overBudget ? "text-red-600" : "text-gray-700"
          }`}
        >
          {percent}%
        </span>
        <span className="text-gray-600">Budget: {budget}</span>
      </div>

      {/* Remaining / Over amount */}
      <p
        className={`mt-2 text-xs font-medium ${
          overBudget ? "text-red-600" : "text-gray-500"
        }`}
      >
        {remainingLabel}
      </p>

      {/* Inline Adjust Budget panel */}
      {isEditing && (
        <AdjustBudgetPanel currentBudget={budget} onSave={onSaveBudget} />
      )}
    </div>
  );
}

const SEASON_OPTIONS = [
  "Long Rains Cycle (March - August 2026)",
  "Short Rains Cycle (September - February 2026)",
];

function NewCategoryModal({ onSave, onCancel }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [season, setSeason] = useState(SEASON_OPTIONS[0]);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  function handleSave() {
    const numericAmount = parseCurrency(amount);
    if (!name.trim() || numericAmount <= 0) {
      setError("Enter a category name and a budget amount greater than 0.");
      return;
    }
    onSave({
      id: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: name.trim(),
      normalBarColor: "bg-[#4f7331]",
      spent: "₱0",
      budget: formatCurrency(numericAmount),
    });
  }

  // Strips any digit characters as the person types, so numbers can never
  // end up in the category name — letters, spaces, and symbols like "&" or
  // "-" are still allowed.
  function handleNameChange(e) {
    setName(e.target.value.replace(/[0-9]/g, ""));
  }

  return (
    <div
      className="bg-black/40 backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <h3 className="text-lg font-bold text-gray-800">
          New Budget Category
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Add a new category to help you plan and track your farm budget.
        </p>

        <div className="mt-5 space-y-4">
          {/* Category Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g., Seed & Planting"
              className="bg-gray-100 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
            />
          </div>

          {/* Budget Amount */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Budget Amount (PHP) *
            </label>
            <div className="bg-gray-100 rounded-xl px-4 py-2.5 text-sm flex items-center gap-2">
              <span className="text-gray-500 font-medium">PHP</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-transparent w-full focus:outline-none"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Enter the total budget allocated for this category.
            </p>
          </div>

          {/* Cycle / Season */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Cycle / Season
            </label>
            <div className="relative">
              <Calendar
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="bg-gray-100 rounded-xl pl-11 pr-4 py-2.5 text-sm w-full appearance-none focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
              >
                {SEASON_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              maxLength={200}
              placeholder="Add notes about this budget category..."
              className="bg-gray-100 rounded-xl p-4 text-sm w-full h-24 resize-none focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
            />
            <p className="text-xs text-gray-400 mt-1">
              {description.length} / 200
            </p>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* Footer buttons */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-[#5bc252] hover:bg-[#4d9e45] text-white px-8 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BudgetManagement() {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);

  function handleEditToggle(id) {
    setEditingCategoryId((current) => (current === id ? null : id));
  }

  function handleSaveBudget(id, newBudgetNumber) {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, budget: formatCurrency(newBudgetNumber) } : c
      )
    );
    setEditingCategoryId(null);
  }

  function handleAddCategory(newCategory) {
    setCategories((prev) => [...prev, newCategory]);
    setIsNewCategoryModalOpen(false);
  }

  return (
    <div>
      {/* Header + New Budget Category button */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Budget Management
          </h2>
          <p className="mt-1 text-gray-500">
            Long Rains Cycle · March - August 2026
          </p>
        </div>
        <button
          onClick={() => setIsNewCategoryModalOpen(true)}
          className="bg-[#3f6238] hover:bg-[#34512e] text-white px-4 py-2 rounded-lg flex items-center gap-1.5 text-sm font-medium shadow-sm transition-colors"
        >
          <Plus size={16} /> New Budget Category
        </button>
      </div>

      {/* Over-budget alert banner */}
      <div className="mt-6 bg-[#fdf2f2] border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-4 shadow-sm">
        <AlertTriangle size={28} className="text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-red-700">Over-budget alert</p>
          <p className="text-gray-700 text-sm mt-0.5">
            Irrigation exceed their allocated budgets. Consider reviewing
            spending or adjusting allocations.
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {KPI_CARDS.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
          >
            <p className="text-xs font-medium text-gray-400">{card.label}</p>
            <p className={`mt-1 text-2xl font-bold ${card.valueColor}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Budget category cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {categories.map((category) => (
          <BudgetCategoryCard
            key={category.id}
            category={category}
            isEditing={editingCategoryId === category.id}
            onEditToggle={() => handleEditToggle(category.id)}
            onSaveBudget={(newBudget) =>
              handleSaveBudget(category.id, newBudget)
            }
          />
        ))}
      </div>

      {/* New Budget Category modal */}
      {isNewCategoryModalOpen && (
        <NewCategoryModal
          onSave={handleAddCategory}
          onCancel={() => setIsNewCategoryModalOpen(false)}
        />
      )}
    </div>
  );
}