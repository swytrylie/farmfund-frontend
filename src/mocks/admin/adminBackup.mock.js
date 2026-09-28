// Mock data for Admin Backup & Recovery.

const MOCK_DELAY_MS = 300;
// Running a backup is simulated as a genuinely longer operation than other
// mock actions, since instant completion wouldn't feel like a real backup
// process.
const BACKUP_DURATION_MS = 2500;

function delay(value, ms = MOCK_DELAY_MS) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const STATUS = {
  lastBackup: "Aug 31, 2026 3:00 AM",
  nextScheduled: "Sep 1, 2026 3:00 AM",
  backupSize: "4.8 GB",
};

const BACKUP_HISTORY = [
  {
    id: "backup-1",
    date: "Aug 31, 2026 3:00 AM",
    type: "Scheduled",
    size: "4.8 GB",
    status: "success",
  },
  {
    id: "backup-2",
    date: "Aug 30, 2026 3:00 AM",
    type: "Scheduled",
    size: "4.7 GB",
    status: "success",
  },
  {
    id: "backup-3",
    date: "Aug 29, 2026 3:00 AM",
    type: "Scheduled",
    size: "4.7 GB",
    status: "success",
  },
  {
    id: "backup-4",
    date: "Aug 28, 2026 11:14 AM",
    type: "Manual",
    size: "4.6 GB",
    status: "success",
  },
];

export async function getBackupData() {
  return delay({ status: STATUS, history: BACKUP_HISTORY });
}

export async function runBackupNow() {
  return delay({ success: true }, BACKUP_DURATION_MS);
}

export async function restoreBackup() {
  return delay({ success: true });
}