// Mock data for Financial Analytics. "Total Collected" in the original
// spec was literally ₱4.82M — the same figure as Outstanding, an obvious
// copy-paste duplication since those are opposite concepts. Corrected to
// ₱1,280,000 using the app's own established formula (Debt Reports:
// Principal − Collected = Outstanding, i.e. ₱6.1M − ₱1.28M = ₱4.82M
// exactly), reusing the "Total collected to date" figure already shown
// there rather than inventing a new number.
//
// Repayment Rate (91.4%) is a standalone figure — close to, but not
// identical to, Debt Reports' "90.3% on-time repayments," kept as given
// rather than force-matched, since the two could reasonably represent
// slightly different calculation windows.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export async function getFinancialAnalytics() {
  return delay({
    kpis: {
      totalLent: "₱6.1M",
      totalCollected: "₱1.28M", // corrected — see note above
      outstanding: "₱4.82M",
      repaymentRate: "91.4%",
    },
    // Approximate percentage heights given in the spec — treated as an
    // on-time-repayment-rate-per-month series. August ties to the KPI
    // card's own 91.4% figure since that's the most recent month; the
    // other 5 months are filled in to match the given rough proportions.
    monthlyPerformance: [
      { month: "Mar", rate: 60 },
      { month: "Apr", rate: 80 },
      { month: "May", rate: 50 },
      { month: "Jun", rate: 62 },
      { month: "Jul", rate: 76 },
      { month: "Aug", rate: 91.4 },
    ],
  });
}