// Mock data for Admin Notification Management.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export const AUDIENCE_OPTIONS = [
  "All users",
  "All farmers",
  "All cooperatives",
  "Unverified farmers",
];

const ANNOUNCEMENTS = [
  {
    id: "ann-1",
    title: "Scheduled maintenance Sep 5",
    audience: "All users",
    sent: "Aug 31, 2026",
    status: "delivered",
    unread: true,
  },
  {
    id: "ann-2",
    title: "Scheduled maintenance Sep 5",
    audience: "All farmers",
    sent: "Aug 31, 2026",
    status: "delivered",
    unread: true,
  },
  {
    id: "ann-3",
    title: "Scheduled maintenance Sep 5",
    audience: "Unverified farmers",
    sent: "Aug 31, 2026",
    status: "delivered",
    unread: true,
  },
];

export async function getAnnouncements() {
  return delay(ANNOUNCEMENTS);
}

export async function sendAnnouncement() {
  return delay({ success: true });
}