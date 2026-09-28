// Mock data for Admin Account Status Management.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

const KPIS = {
  active: 1238,
  suspended: 7,
  deactivated: 3,
};

const USERS = [
  {
    id: "acc-1",
    name: "Kiko Barzaga",
    status: "suspended",
    reason: "Multiple overdue loans, under review",
    changedBy: "BongBong Marcos",
  },
  {
    id: "acc-2",
    name: "Marie Curie",
    status: "deactivated",
    reason: "Requested by user",
    changedBy: "BongBong Marcos",
  },
  {
    id: "acc-3",
    name: "Jose Rizal",
    status: "active",
    reason: "-",
    changedBy: "-",
  },
  {
    id: "acc-4",
    name: "John Doe",
    status: "restricted",
    reason: "Limited to view-only pending KYC re-verification",
    changedBy: "BongBong Marcos",
  },
];

export async function getAccountStatuses() {
  return delay({ kpis: KPIS, users: USERS });
}

export async function suspendAccount() {
  return delay({ success: true });
}

export async function restoreAccount() {
  return delay({ success: true });
}

export async function liftRestriction() {
  return delay({ success: true });
}