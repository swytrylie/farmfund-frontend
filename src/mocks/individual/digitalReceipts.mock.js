// Mock data for the Digital Receipts page. Card statuses/amounts updated
// per the latest spec: Pacifica is now "pending" (was "scanned"), and URC
// Feeds' amount changed to ₱12,400 (was ₱42,400) with no status badge.
//
// Only East-West Seed's full detail (payment method, line item) was given
// exactly — every other receipt's payment/lineItem below is a reasonable
// invented placeholder, not specified data.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export const CATEGORY_OPTIONS = [
  "Inputs",
  "Labor",
  "Equipment",
  "Feeds",
  "Irrigation",
  "Livestock Supplies",
  "Other",
];

export const PAYMENT_METHOD_OPTIONS = ["GCash", "Cash", "Bank Transfer"];

export async function getReceiptsData() {
  return delay({
    kpis: {
      totalReceipts: 89,
      verified: 86,
      verifiedRate: "96.6%",
      totalValue: "₱520,000",
    },

    receipts: [
      {
        id: "RCP-2026-0089",
        vendor: "East-West Seed Philippines, Inc.",
        date: "2026-08-29",
        amount: "₱18,500",
        category: "Inputs",
        payment: "GCash",
        lineItem: "50kg NPK Fertilizer x 1",
        status: "scanned",
      },
      {
        id: "RCP-2026-0088",
        vendor: "Pacifica Agrivet Supplies, Inc.",
        date: "2026-08-28",
        amount: "₱42,400",
        category: "Livestock Supplies",
        payment: "Bank Transfer",
        lineItem: "Assorted vet supplies x 1 lot",
        status: "pending",
      },
      {
        id: "RCP-2026-0087",
        vendor: "Universal Robina Corporation (URC Feeds)",
        date: "2026-08-27",
        amount: "₱12,400",
        category: "Feeds",
        payment: "Cash",
        lineItem: "Layer feeds 50kg x 4 sacks",
        status: null,
      },
      {
        id: "RCP-2026-0086",
        vendor: "Landbank Agri-Supply Center",
        date: "2026-08-24",
        amount: "₱9,200",
        category: "Equipment",
        payment: "GCash",
        lineItem: "Hand tools bundle x 1",
        status: "scanned",
      },
      {
        id: "RCP-2026-0085",
        vendor: "Metro Irrigation Systems Co.",
        date: "2026-08-20",
        amount: "₱27,400",
        category: "Irrigation",
        payment: "Bank Transfer",
        lineItem: "Drip irrigation line 100m x 1",
        status: "scanned",
      },
      {
        id: "RCP-2026-0084",
        vendor: "Kasama Farmers Cooperative",
        date: "2026-08-15",
        amount: "₱6,300",
        category: "Labor",
        payment: "Cash",
        lineItem: "Day labor, harvest crew x 3 days",
        status: "pending",
      },
    ],
  });
}