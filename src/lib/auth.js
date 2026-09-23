// Temporary fixed login credentials until a real backend exists.
// Using these exact values on the Log In form succeeds and navigates to the
// Dashboard; anything else counts as a "failed" attempt (see LoginForm),
// which is what powers the account-lockout flow.
export const TEST_LOGIN_EMAIL = "test@farmfund.ph";
export const TEST_LOGIN_PASSWORD = "Test1234";