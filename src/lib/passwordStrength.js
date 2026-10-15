import { passwordChecks, passwordLive } from "./signupValidation";

// Strength is scored against the SAME rules the sign-up form enforces (8+
// characters, a letter, a number, a symbol, and only keyboard characters with
// no spaces — see signupValidation.js), so a password shown as Medium or
// Strong is never rejected by the form. The meter is slightly stricter in one
// way: passwords built on very common words (e.g. "password1!") show as Weak
// even though the form itself would accept them.
const COMMON_PASSWORDS = [
  "password", "12345678", "qwerty", "abc123", "letmein", "admin", "iloveyou", "farmfund",
];

export function getPasswordStrength(password) {
  if (!password) return { level: 0, label: "", hint: "" };

  // A character that isn't allowed (a space, an accented letter, an emoji…)
  // is a problem before anything else: say so instead of scoring it.
  const notAllowed = passwordLive(password);
  if (notAllowed) {
    return { level: 1, label: "Weak", hint: notAllowed };
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);

  const missing = passwordChecks(password)
    .filter((check) => !check.met)
    .map((check) => ({
      length: "8+ characters",
      letter: "a letter",
      number: "a number",
      symbol: "a special character (e.g. ! @ # $ %)",
    })[check.id]);

  const isCommon = COMMON_PASSWORDS.some((w) => password.toLowerCase().includes(w));

  if (missing.length > 0 || isCommon) {
    return {
      level: 1,
      label: "Weak",
      hint: isCommon && missing.length === 0
        ? "Avoid common words and patterns."
        : `Add ${missing.join(", ")}.`,
    };
  }

  if (password.length < 12 || !hasLower || !hasUpper) {
    return {
      level: 2,
      label: "Medium",
      hint: "Use 12+ characters with upper and lower case letters to make it Strong.",
    };
  }

  return { level: 3, label: "Strong", hint: "Great — this password meets every requirement." };
}

// --- Suggested password generator ---
// Uses the browser's cryptographic random source (not Math.random), skips
// look-alike characters (l, I, O, 0, 1), and only uses symbols that
// the form accepts. Always includes 2+ of every character class.
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%^&*";

function randomInt(max) {
  const limit = Math.floor(0x100000000 / max) * max; // avoids modulo bias
  const buf = new Uint32Array(1);
  let n;
  do {
    crypto.getRandomValues(buf);
    n = buf[0];
  } while (n >= limit);
  return n % max;
}

export function generateStrongPassword(length = 14) {
  const pick = (chars) => chars[randomInt(chars.length)];
  const all = LOWER + UPPER + DIGITS + SYMBOLS;

  const chars = [
    pick(LOWER), pick(LOWER),
    pick(UPPER), pick(UPPER),
    pick(DIGITS), pick(DIGITS),
    pick(SYMBOLS), pick(SYMBOLS),
  ];
  while (chars.length < length) chars.push(pick(all));

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}