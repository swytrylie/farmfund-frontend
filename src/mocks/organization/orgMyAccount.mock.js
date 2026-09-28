// Mock data for My Account.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

const MY_ACCOUNT = {
  firstName: "Ahshagaah",
  lastName: "Shagh",
  middleName: "",
  email: "owner@gmail.com",
  role: "Owner",
  avatarUrl: null,
};

// Mock "current" password for the logged-in user, to check Current Password
// against — a placeholder for a real backend check.
export const MOCK_CURRENT_PASSWORD = "OldPass123";

export async function getMyAccount() {
  return delay(MY_ACCOUNT);
}

export async function saveMyAccount() {
  return delay({ success: true });
}

export async function updatePassword() {
  return delay({ success: true });
}