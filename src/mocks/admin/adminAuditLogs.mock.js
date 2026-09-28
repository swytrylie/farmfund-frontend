// Mock data for Admin Audit Logs. Every row here documents a real action
// from elsewhere in this app: Row 1 matches the Financial Record
// Monitoring access request for Nelmar, Row 2 matches Kiko's suspension in
// Account Status Management, Row 3 matches his RSBSA document in Borrower
// Management, Row 4 matches the pending staff invite in Team & Invitations.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export const CATEGORY_FILTERS = ["All", "Admin actions", "Cooperative actions"];

const LOGS = [
  {
    id: "log-1",
    actor: "BongBong Marcos (Admin)",
    action: "Requested individual record access",
    target: "Nelmar Lauron - reason pending",
    timestamp: "Aug 31, 2026 9:40 AM",
    category: "admin",
  },
  {
    id: "log-2",
    actor: "BongBong Marcos (Admin)",
    action: "Suspended account",
    target: "Kiko Barzaga",
    timestamp: "Aug 31, 2026 9:02 AM",
    category: "admin",
  },
  {
    id: "log-3",
    actor: "Albert Einstein (Financial Manager)",
    action: "Verified Document",
    target: "RSBA Registration - Nelmar Lauron",
    timestamp: "May 1, 2025 10:05 AM",
    category: "cooperative",
  },
  {
    id: "log-4",
    actor: "Ahshagaah Shagh (Cooperative Owner)",
    action: "Invited staff member",
    target: "invited@gmail.com",
    timestamp: "Mar 18, 2026 2:41 PM",
    category: "cooperative",
  },
];

export async function getAuditLogs() {
  return delay(LOGS);
}