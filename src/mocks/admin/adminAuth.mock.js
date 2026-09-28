// Mock data for Admin authentication. A placeholder until a real backend
// admin auth endpoint exists — same mock-only pattern already used for
// organization accounts throughout this app.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

const MOCK_ADMIN_EMAIL = "admin@gmail.com";
const MOCK_ADMIN_PASSWORD = "Admin1234!";

// Returns the admin user object on success, or null on invalid credentials
// — the caller decides what error message to show.
export async function checkAdminCredentials(email, password) {
  const isValid =
    email.trim().toLowerCase() === MOCK_ADMIN_EMAIL && password === MOCK_ADMIN_PASSWORD;

  if (!isValid) return delay(null);

  return delay({
    accountType: "admin",
    role: "System Admin",
    firstName: "Fengfeng",
    lastName: "Muerza",
    email: MOCK_ADMIN_EMAIL,
  });
}