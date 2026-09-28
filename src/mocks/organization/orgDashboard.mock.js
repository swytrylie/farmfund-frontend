// Mock data for the Agri Coop / Lender dashboard's home page. These are
// aggregate cooperative statistics that have nothing to do with the real
// signing-up organization (impossible to derive from signup form data),
// so they stay as reasonable mock figures — unlike the greeting and org
// name shown alongside them, which come from the real logged-in user.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export async function getOrgDashboardOverview() {
  return delay({
    kpis: [
      {
        label: "TOTAL BORROWERS",
        value: "86",
        subtext: "Registered farmers",
        subtextColor: "text-green-600",
        borderColor: "border-green-600",
      },
      {
        label: "OUTSTANDING DEBT",
        value: "₱4.82M",
        subtext: "6 Active loans",
        subtextColor: "text-amber-600",
        borderColor: "border-amber-500",
      },
      {
        label: "TOTAL COLLECTED",
        value: "₱612,400",
        subtext: "+11.2% vs August",
        subtextColor: "text-blue-600",
        borderColor: "border-blue-500",
      },
      {
        label: "OVERDUE LOANS",
        value: "7",
        subtext: "₱318,000 at risk",
        subtextColor: "text-red-600",
        borderColor: "border-red-500",
      },
    ],

    // Only June's figures were given exactly (Collected ₱612,400, Target
    // ₱580,000) — every other month here is a filled-in placeholder,
    // built around June as the standout month the hover callout points at.
    collectionsTrend: [
      { month: "Mar", collected: 420000, target: 400000 },
      { month: "Apr", collected: 465000, target: 440000 },
      { month: "May", collected: 510000, target: 490000 },
      { month: "Jun", collected: 612400, target: 580000 }, // given
      { month: "Jul", collected: 545000, target: 560000 },
      { month: "Aug", collected: 598000, target: 570000 },
    ],

    needsAttention: [
      { name: "Nelmar Lauron", note: "726 days overdue", tag: "Overdue" },
      { name: "Juan Dela Cruz", note: "6 days overdue", tag: "Overdue" },
      { name: "Asdf Ghjk", note: "Due in 3 days", tag: "Due soon" },
    ],
  });
}