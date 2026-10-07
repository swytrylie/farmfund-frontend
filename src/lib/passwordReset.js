// Holds the "reset ticket" between the three forgot-password screens
// (email -> code -> new password). It lives only in this page's memory: never
// in localStorage, never in the URL, and it disappears on refresh or once the
// password has been changed.
let pending = null;

export function setPendingReset(email, resetToken) {
  pending = { email, resetToken };
}

export function getPendingReset() {
  return pending;
}

export function clearPendingReset() {
  pending = null;
}