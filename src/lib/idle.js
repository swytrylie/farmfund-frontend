// Idle sign-out: the rules, kept in one place so the browser and the tests
// agree. A session ends after IDLE_LIMIT_MS without the person doing anything
// (click, key press, scroll, touch, mouse move). The server enforces the same
// limit as a backstop (see the backend's utils/idle.js).

export const IDLE_LIMIT_MS = 10 * 60 * 1000; // sign out after 10 minutes
export const WARNING_MS = 60 * 1000; // warn during the last minute
export const PING_EVERY_MS = 30 * 1000; // tell the server "still here" at most this often
export const ACTIVITY_KEY = "farmfund.lastActivity";
export const IDLE_CODE = "SESSION_IDLE"; // the code the server puts on its "you were idle" answers
export const IDLE_MESSAGE = "You were signed out after 10 minutes of inactivity. Please sign in again.";

// Where the person stands, given the time of their last action.
//   active  — more than a minute left
//   warning — the last minute: show the "still there?" box
//   expired — time is up: sign out
export function idleStatus(lastActivity, now) {
  const left = IDLE_LIMIT_MS - (now - lastActivity);
  if (left <= 0) return { state: "expired", secondsLeft: 0 };
  if (left <= WARNING_MS) return { state: "warning", secondsLeft: Math.ceil(left / 1000) };
  return { state: "active", secondsLeft: Math.ceil(left / 1000) };
}

// How long to wait before the next "still here" message to the server, given
// when the last one went out. 0 = send now.
export function pingDelay(lastPing, now) {
  return Math.max(0, PING_EVERY_MS - (now - lastPing));
}

export function isIdleError(err) {
  return Boolean(err) && err.code === IDLE_CODE;
}

// Activity is shared between browser tabs of the same site, so working in one
// tab keeps the others signed in. (They share one login anyway.) Storage can be
// blocked or full; then each tab simply goes by its own clock.
export function readSharedActivity() {
  try {
    const n = Number(window.localStorage.getItem(ACTIVITY_KEY));
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function writeSharedActivity(time) {
  try {
    window.localStorage.setItem(ACTIVITY_KEY, String(time));
  } catch {
    // blocked or full: fine, this tab still has its own record
  }
}