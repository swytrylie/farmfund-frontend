// Mock data for the AI Financial Summary page. Most figures here were
// cross-checked against Dashboard, Loans & Debt, Crop / Livestock, and
// Budget Management, and reconcile correctly — except the total active
// loans figure (₱151,000 here vs ₱151,500 on Dashboard vs ₱175,000 if
// summed from the Loans & Debt page's own cards). Kept as given for this
// page; worth reconciling across all three eventually.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export async function getAISummary(firstName, lastName) {
  const name = firstName || "there";
  const farmName = lastName ? `${lastName} Family Farm` : "your farm";

  return delay({
    period: "August 2026",

    // Segments render as plain text, except isHighlight ones which render
    // in the gold/amber highlight color within the narrative headline.
    narrative: [
      { text: `${name}, this was a strong month for ${farmName} — ` },
      { text: "income grew", isHighlight: true },
      { text: ", your " },
      { text: "tomato crop is your best performer", isHighlight: true },
      { text: ", and " },
      { text: "both active loans are on schedule", isHighlight: true },
      { text: "." },
    ],

    metrics: [
      {
        label: "TOTAL INCOME",
        value: "₱58,200",
        change: "+8.3% vs last month",
        changeColor: "text-green-300",
      },
      {
        label: "TOTAL EXPENSES",
        value: "₱12,590",
        change: "-2.1% vs last month",
        changeColor: "text-green-300",
      },
      {
        label: "NET BALANCE",
        value: "₱45,610",
        change: "+18.4% vs last month",
        changeColor: "text-green-300",
      },
      {
        label: "ACTIVE LOANS",
        value: "₱151,000",
        change: "2 loans both on time",
        changeColor: "text-amber-300",
      },
    ],

    drivers: [
      {
        key: "income-expenses",
        title: "Income and expenses",
        iconBg: "bg-[#dcfce7]",
        iconColor: "text-emerald-700",
        borderColor: "border-blue-400",
        text: "You earned ₱58,200 and kept expenses to ₱12,590, leaving a net balance of ₱45,610, a 78% margin this month, driven mostly by corn harvest and vegetable sales at the public market.",
        tags: [
          { label: "+18.4% net balance", color: "bg-green-100 text-green-800" },
          { label: "Expenses down 2.1%", color: "bg-gray-100 text-gray-700" },
        ],
      },
      {
        key: "crop-profitability",
        title: "Crop and livestock profitability",
        iconBg: "bg-[#fef3c7]",
        iconColor: "text-amber-700",
        borderColor: "border-amber-400",
        text: "Tomatoes are your standout crop, ₱72,000 revenue against ₱38,000 in costs, a 47% margin and ₱22,667 profit per acre, the best return of your three tracked crops. Corn remains your largest revenue source at ₱98,000 but runs a thinner 38% margin. Beans sit in between at 42%.",
        tags: [
          { label: "Tomatoes: 47% margin", color: "bg-amber-100 text-amber-800" },
          { label: "Corn: 38% margin", color: "bg-gray-100 text-gray-700" },
          { label: "Beans: 42% margin", color: "bg-gray-100 text-gray-700" },
        ],
      },
      {
        key: "loans-debt",
        title: "Loans and debt",
        iconBg: "bg-[#dcfce7]",
        iconColor: "text-emerald-700",
        borderColor: "border-green-400",
        text: "Both active loans are on schedule, LANDBANK Agriculture and the Agrarian Reform Fund are each 42% paid, with ₱151,000 outstanding overall. Your next payment of ₱14,200 is due September 5, in 7 days. Your Farmers SACCO seasonal loan has already been fully repaid.",
        tags: [
          { label: "Farmers SACCO: fully repaid", color: "bg-green-100 text-green-800" },
          { label: "Next due: Sep 5", color: "bg-gray-100 text-gray-700" },
        ],
      },
      {
        key: "budget-management",
        title: "Budget Management",
        iconBg: "bg-[#dcfce7]",
        iconColor: "text-emerald-700",
        borderColor: "border-red-400",
        text: "Your irrigation budget is over for the Long Rains cycle — ₱27,400 spent against a ₱25,000 allocation, about ₱2,400 over. Every other category is tracking within budget, with ₱41,800 remaining across your ₱247,000 total.",
        tags: [
          { label: "Irrigation: over by ₱2,400", color: "bg-red-100 text-red-700" },
          { label: "5 of 6 categories on track", color: "bg-green-100 text-green-800" },
        ],
      },
    ],

    focusRecommendation:
      "Your farm is financially healthy this cycle. Consider expanding tomato acreage given its strong margin, and review irrigation spending on Plot B before Long Rains begins again — fixing the reported leak could bring that category back within budget.",
  });
}