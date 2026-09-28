// Mock data for the Borrower & Debt Management page. Only the first 4
// borrowers and their document sets for Nelmar specifically were given
// exactly — extra borrowers and simpler document sets for the others were
// added so search/filter and the detail panel have enough data to be
// meaningfully interactive, not because they were specified.
//
// Row 1's table badge literally says "Active" while the filter pill and
// detail panel say "Current" for the same underlying status — kept exactly
// as given in each spot; status filtering uses a single normalized key
// ("current") under both display labels.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export const STATUS_FILTERS = ["All", "Current", "Overdue", "Fully paid"];

const BORROWERS = [
  {
    id: "b1",
    name: "Nelmar Lauron",
    farmName: "Lauron Family Farm",
    location: "Dagupan City, Pangasinan",
    contact: "+63 917 XXX 2201",
    totalDebt: 500000,
    paid: 188000,
    status: "current",
    // Sums exactly to `paid` (188,000) — not specified in the original
    // spec, invented to make "View full payment history" genuinely work.
    paymentHistory: [
      { date: "2024-03-05", amount: 40000, method: "Bank Transfer" },
      { date: "2024-06-05", amount: 40000, method: "Bank Transfer" },
      { date: "2024-09-05", amount: 38000, method: "GCash" },
      { date: "2024-12-05", amount: 35000, method: "Bank Transfer" },
      { date: "2025-03-05", amount: 35000, method: "GCash" },
    ],
    documents: [
      {
        id: "DOC-2021-0342",
        name: "RSBSA Registration",
        uploaded: "Uploaded Mar 2021",
        reviewStatus: "unreviewed",
      },
      {
        id: "DOC-2021-0343",
        name: "Land Title - OCT",
        uploaded: "Uploaded Mar 2021",
        reviewStatus: "verified",
      },
      {
        id: "DOC-2026-0089",
        name: "PhilGAP Certificate",
        uploaded: "Uploaded Jan 2026",
        reviewStatus: "pending",
      },
    ],
  },
  {
    id: "b2",
    name: "Juan Dela Cruz",
    farmName: "Dela Cruz Rice Farm",
    location: "San Fabian, Pangasinan",
    contact: "+63 918 XXX 4472",
    totalDebt: 180000,
    paid: 60000,
    status: "overdue",
    paymentHistory: [
      { date: "2025-01-10", amount: 30000, method: "Cash" },
      { date: "2025-04-10", amount: 30000, method: "Cash" },
    ],
    documents: [
      {
        id: "DOC-2020-0118",
        name: "RSBSA Registration",
        uploaded: "Uploaded Jun 2020",
        reviewStatus: "verified",
      },
    ],
  },
  {
    id: "b3",
    name: "Asdf Ghjk",
    farmName: "Ghjk Livestock",
    location: "Mangaldan, Pangasinan",
    contact: "+63 920 XXX 5581",
    totalDebt: 95000,
    paid: 15000,
    status: "overdue",
    paymentHistory: [{ date: "2025-02-14", amount: 15000, method: "GCash" }],
    documents: [
      {
        id: "DOC-2022-0207",
        name: "RSBSA Registration",
        uploaded: "Uploaded Feb 2022",
        reviewStatus: "pending",
      },
    ],
  },
  {
    id: "b4",
    name: "Zxcv Bnm",
    farmName: "Bnm Corn Farm",
    location: "Calasiao, Pangasinan",
    contact: "+63 922 XXX 1187",
    totalDebt: 120000,
    paid: 120000,
    status: "fully-paid",
    paymentHistory: [
      { date: "2024-01-20", amount: 40000, method: "Bank Transfer" },
      { date: "2024-04-20", amount: 40000, method: "Bank Transfer" },
      { date: "2024-07-20", amount: 40000, method: "Bank Transfer" },
    ],
    documents: [
      {
        id: "DOC-2019-0054",
        name: "RSBSA Registration",
        uploaded: "Uploaded Nov 2019",
        reviewStatus: "verified",
      },
    ],
  },
  {
    id: "b5",
    name: "Maria Santos",
    farmName: "Santos Vegetable Garden",
    location: "Binmaley, Pangasinan",
    contact: "+63 921 XXX 3390",
    totalDebt: 75000,
    paid: 75000,
    status: "fully-paid",
    paymentHistory: [
      { date: "2024-03-15", amount: 25000, method: "GCash" },
      { date: "2024-06-15", amount: 25000, method: "GCash" },
      { date: "2024-09-15", amount: 25000, method: "GCash" },
    ],
    documents: [
      {
        id: "DOC-2021-0198",
        name: "RSBSA Registration",
        uploaded: "Uploaded Aug 2021",
        reviewStatus: "verified",
      },
    ],
  },
  {
    id: "b6",
    name: "Ramon Cruz",
    farmName: "Cruz Poultry Farm",
    location: "Lingayen, Pangasinan",
    contact: "+63 919 XXX 7765",
    totalDebt: 210000,
    paid: 84000,
    status: "current",
    paymentHistory: [
      { date: "2025-02-01", amount: 28000, method: "Bank Transfer" },
      { date: "2025-05-01", amount: 28000, method: "Bank Transfer" },
      { date: "2025-08-01", amount: 28000, method: "Bank Transfer" },
    ],
    documents: [
      {
        id: "DOC-2023-0044",
        name: "RSBSA Registration",
        uploaded: "Uploaded May 2023",
        reviewStatus: "verified",
      },
    ],
  },
];

export async function getBorrowerData() {
  return delay({
    kpis: {
      totalBorrowers: 86,
      totalDebtHeld: "₱960,000",
      totalPaid: "₱422,000",
      overdueBorrowers: 7,
    },
    borrowers: BORROWERS,
  });
}

export async function updateDocumentReview() {
  return delay({ success: true });
}