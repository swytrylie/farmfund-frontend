// Account lockout, as the browser sees it.
//
// The SERVER decides when a lock starts and ends (4 wrong passwords: 15 minutes,
// then 30 minutes each time). The browser only shows it, and remembers it, so a
// page refresh can never restart the countdown: what is stored is the moment the
// lock ends, not "15:00 left".

export const LOCK_STORAGE_KEY = "farmfund.lock";
export const LOCK_POLL_MS = 30 * 1000; // how often the lock screen asks "unlocked yet?"
export const MESSAGE_MIN = 3;
export const MESSAGE_MAX = 300;

// MM:SS under an hour, HH:MM:SS once it reaches an hour or more
export function formatLockoutTime(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

// Whole seconds left until the lock ends (never below 0).
export function secondsLeftUntil(endsAt, now = Date.now()) {
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

// Builds the lock to show from what the server said ({ secondsLeft, minutes,
// requestSent }). The end time is worked out from the server's own "seconds
// left", so a wrong clock on this computer can't skew it. Returns null when
// the server gave no time at all.
export function lockFromServer(details, email, now = Date.now()) {
  if (!details || typeof details.secondsLeft !== "number") return null;
  return {
    email: email || "",
    endsAt: now + details.secondsLeft * 1000,
    minutes: details.minutes || null,
    requestSent: Boolean(details.requestSent),
  };
}

// The lock saved in this browser, if it is still running.
export function readStoredLock(now = Date.now()) {
  try {
    const raw = window.localStorage.getItem(LOCK_STORAGE_KEY);
    if (!raw) return null;
    const lock = JSON.parse(raw);
    if (!lock || typeof lock.endsAt !== "number" || lock.endsAt <= now) {
      window.localStorage.removeItem(LOCK_STORAGE_KEY);
      return null;
    }
    return {
      email: typeof lock.email === "string" ? lock.email : "",
      endsAt: lock.endsAt,
      minutes: lock.minutes || null,
      requestSent: Boolean(lock.requestSent),
    };
  } catch {
    return null;
  }
}

export function storeLock(lock) {
  try {
    window.localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(lock));
  } catch {
    // storage blocked: the lock still shows now, the server still enforces it
  }
}

export function clearStoredLock() {
  try {
    window.localStorage.removeItem(LOCK_STORAGE_KEY);
  } catch {
    // nothing to clear
  }
}

// Checks the message a locked-out person writes to the admin. Returns an error
// text, or "" when it is fine.
export function validateAdminMessage(text) {
  const t = String(text || "").trim();
  if (t.length < MESSAGE_MIN) return `Write at least ${MESSAGE_MIN} characters so the admin knows what happened.`;
  if (t.length > MESSAGE_MAX) return `Keep it to ${MESSAGE_MAX} characters or fewer.`;
  if (/[<>]/.test(t)) return "The message cannot contain < or >.";
  return "";
}