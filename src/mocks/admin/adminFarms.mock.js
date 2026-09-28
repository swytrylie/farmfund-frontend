// Mock data for Admin Farm Management.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

const KPIS = {
  registeredFarms: "1,190",
  avgFarmSize: "3.4 ha",
  linkedToCooperative: "83%",
  linkedToIndividualLender: "9%",
};

const FARMS = [
  {
    id: "farm-1",
    name: "Lauron Family Farm",
    farmer: "Nelmar Lauron",
    location: "Dagupan City, Pangasinan",
    size: "7.0 ha",
    cooperative: "Kasama Farmers Association",
    status: "active",
  },
  {
    id: "farm-2",
    name: "Dela Cruz Rice Farm",
    farmer: "Juan Dela Cruz",
    location: "Nueva Ecija",
    size: "4.2 ha",
    cooperative: "Kasama Farmers Association",
    status: "active",
  },
  {
    id: "farm-3",
    name: "Barzaga Livestock",
    farmer: "Kiko Barzaga",
    location: "Tarlac",
    size: "2.8 ha",
    cooperative: "Individual Lender - Albert Einstein",
    status: "under-review",
  },
  {
    id: "farm-4",
    name: "Aquino Vegetable Plot",
    farmer: "Ninoy Aquino",
    location: "Bayambang, Pangasinan",
    size: "-",
    cooperative: null, // "— No lender yet"
    status: null, // no badge
  },
];

export async function getFarms() {
  return delay({ kpis: KPIS, farms: FARMS });
}