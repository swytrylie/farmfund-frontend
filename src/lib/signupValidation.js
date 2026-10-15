// Sign-up rules, shared by the Individual and Organization forms.
//
// Every field has TWO kinds of check:
//
//   LIVE   — "that character isn't allowed here". Runs on every keystroke and
//            shows at once, even in a field the person has only just started
//            typing in. Nothing here says "you haven't finished yet".
//   FINAL  — "this is required / incomplete / the wrong shape". Only shown
//            after the person leaves the field or presses Submit, so a half-
//            typed email isn't shouted at on the first letter.
//
// getLiveErrors() returns the live problems. getAllErrors() returns live +
// final together, and is what decides whether the form can be submitted.
//
// The server applies the SAME rules (backend validators/auth.validator.js), so
// anything accepted here is accepted there. Plain functions, no JSX.

export const NAME_MAX = 50;
export const ORG_NAME_MAX = 150;
export const REG_NO_MAX = 30;
export const EMAIL_MAX = 254;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 64;
export const CONTACT_LENGTH = 11;

// One character each. Letters/marks/numbers from ANY language (Peña, Muñoz).
const NAME_CHAR = /[\p{L}\p{M} '’.-]/u;
const ORG_NAME_CHAR = /[\p{L}\p{M}\p{N} '’.,&()/#-]/u;
const REG_NO_CHAR = /[A-Za-z0-9 /.-]/;
const EMAIL_CHAR = /[A-Za-z0-9.!#$%&'*+/=?^_`{|}~@-]/;
// Printable ASCII with NO space: what a keyboard types without a language pack.
const PASSWORD_CHAR = /[\x21-\x7E]/;
// The ASCII punctuation, i.e. what counts as "a symbol" in a password.
export const SYMBOL_REGEX = /[\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]/;

// --- helpers ---------------------------------------------------------------

// Distinct characters of `value` that `allowed` (a single-character regex) rejects.
export function findDisallowed(value, allowed) {
  const found = [];
  for (const ch of Array.from(value || "")) {
    if (!allowed.test(ch) && !found.includes(ch)) found.push(ch);
  }
  return found;
}

function nameOf(ch) {
  if (ch === " ") return "spaces";
  if (ch === "\t" || ch === "\n" || ch === "\r") return "tabs or line breaks";
  return `"${ch}"`;
}

// ["4"] -> `"4"`   ["4","@"] -> `"4" or "@"`   (long lists are cut short)
export function describeChars(chars) {
  const names = [...new Set(chars.map(nameOf))];
  if (names.length > 4) return `${names.slice(0, 4).join(", ")} or others`;
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
}

function notAllowed(label, chars, allowedText) {
  return `${label} can't contain ${describeChars(chars)}. ${allowedText}`;
}

const trimmed = (v) => (typeof v === "string" ? v.trim() : "");

// --- names -----------------------------------------------------------------

const NAME_HELP = "Use letters, spaces, apostrophes ( ' ), hyphens or periods only.";

export function nameLive(value, label) {
  const bad = findDisallowed(value, NAME_CHAR);
  if (bad.length) return notAllowed(label, bad, NAME_HELP);
  if (value.length > NAME_MAX) return `${label} must be ${NAME_MAX} characters or fewer.`;
  return null;
}

export function nameFinal(value, label, { required = true } = {}) {
  const v = trimmed(value);
  if (!v) return required ? `${label} is required.` : null;
  if (!/^[\p{L}\p{M}]/u.test(v)) return `${label} must start with a letter.`;
  return null;
}

// --- organization name / registration number ------------------------------

const ORG_HELP = "Use letters, numbers, spaces and these symbols: ' & , . ( ) / # -";

export function orgNameLive(value) {
  const bad = findDisallowed(value, ORG_NAME_CHAR);
  if (bad.length) return notAllowed("Organization name", bad, ORG_HELP);
  if (value.length > ORG_NAME_MAX) return `Organization name must be ${ORG_NAME_MAX} characters or fewer.`;
  return null;
}

export function orgNameFinal(value) {
  const v = trimmed(value);
  if (!v) return "Organization name is required.";
  if (!/^[\p{L}\p{M}\p{N}]/u.test(v)) return "Organization name must start with a letter or number.";
  return null;
}

const REG_HELP = "Use letters, numbers, hyphens and slashes only.";

export function registrationNoLive(value) {
  const bad = findDisallowed(value, REG_NO_CHAR);
  if (bad.length) return notAllowed("Registration number", bad, REG_HELP);
  if (value.length > REG_NO_MAX) return `Registration number must be ${REG_NO_MAX} characters or fewer.`;
  return null;
}

export function registrationNoFinal(value) {
  if (!trimmed(value)) return "Registration number is required.";
  return null;
}

// --- email -----------------------------------------------------------------

const EMAIL_HELP = "Use English letters, numbers and the symbols . _ - + only.";

export function emailLive(value) {
  const bad = findDisallowed(value, EMAIL_CHAR);
  if (bad.length) return notAllowed("Email", bad, EMAIL_HELP);
  if ((value.match(/@/g) || []).length > 1) return "An email address can only have one @.";
  if (value.length > EMAIL_MAX) return `Email must be ${EMAIL_MAX} characters or fewer.`;
  return null;
}

export function emailFinal(value) {
  const v = trimmed(value);
  if (!v) return "Email is required.";
  const at = v.indexOf("@");
  if (at === -1) return "Add an @ — for example name@example.com.";
  const local = v.slice(0, at);
  const domain = v.slice(at + 1);
  if (!local) return "Add the part before the @ — for example name@example.com.";
  if (!domain) return "Add the part after the @ — for example name@example.com.";
  if (local.length > 64) return "The part before the @ is too long (64 characters at most).";
  if (local.startsWith(".") || local.endsWith(".") || local.includes(".."))
    return "The part before the @ can't start or end with a dot, or have two dots in a row.";
  if (!domain.includes(".")) return "The part after the @ needs a dot — for example example.com.";
  const labels = domain.split(".");
  if (labels.some((l) => !l || l.startsWith("-") || l.endsWith("-") || !/^[A-Za-z0-9-]+$/.test(l)))
    return "The part after the @ isn't valid — check the dots and letters.";
  if (!/^[A-Za-z]{2,}$/.test(labels[labels.length - 1]))
    return "The ending (like .com or .ph) must be at least 2 letters.";
  return null;
}

// --- password --------------------------------------------------------------

// The four things a password needs, each true/false for the current text.
export function passwordChecks(password, minLength = PASSWORD_MIN) {
  const p = password || "";
  return [
    { id: "length", label: `At least ${minLength} characters`, met: p.length >= minLength },
    { id: "letter", label: "A letter (a–z)", met: /[A-Za-z]/.test(p) },
    { id: "number", label: "A number (0–9)", met: /[0-9]/.test(p) },
    { id: "symbol", label: "A symbol (! @ # $ %)", met: SYMBOL_REGEX.test(p) },
  ];
}

export function passwordLive(value) {
  const bad = findDisallowed(value, PASSWORD_CHAR);
  if (bad.length === 1 && bad[0] === " ") return "Spaces aren't allowed in a password.";
  if (bad.length)
    return `Password can't contain ${describeChars(bad)}. Use only letters, numbers and symbols from the keyboard — no spaces.`;
  if (value.length > PASSWORD_MAX) return `Password must be ${PASSWORD_MAX} characters or fewer.`;
  return null;
}

export function passwordFinal(value, minLength = PASSWORD_MIN) {
  if (!value) return "Password is required.";
  if (value.length < minLength) return `Use at least ${minLength} characters.`;
  if (!/[A-Za-z]/.test(value)) return "Include at least one letter.";
  if (!/[0-9]/.test(value)) return "Include at least one number.";
  if (!SYMBOL_REGEX.test(value)) return "Include at least one special character (e.g. ! @ # $ %).";
  return null;
}

// While typing the confirmation: it must so far be the start of the password.
export function confirmLive(confirm, password) {
  if (confirm && !(password || "").startsWith(confirm)) return "This doesn't match the password above.";
  return null;
}

export function confirmFinal(confirm, password) {
  if (!confirm) return "Please confirm your password.";
  if (confirm !== password) return "Passwords don't match.";
  return null;
}

// --- contact number / date -------------------------------------------------

export function contactFinal(value) {
  if (!value) return "Contact number is required.";
  if (value.length !== CONTACT_LENGTH) return `Enter all ${CONTACT_LENGTH} digits — for example 09171234567.`;
  return null;
}

// Digits only. Anything else the person typed or pasted is dropped, and
// `rejected` lists what was dropped so the form can say so straight away.
export function filterContactInput(raw) {
  const text = String(raw ?? "");
  const rejected = findDisallowed(text, /[0-9]/);
  const digits = text.replace(/\D/g, "");
  return { value: digits.slice(0, CONTACT_LENGTH), rejected, tooLong: digits.length > CONTACT_LENGTH };
}

export function contactNote(result) {
  if (result.rejected.length)
    return `Only numbers are allowed here (${describeChars(result.rejected)} removed).`;
  if (result.tooLong) return `A contact number has ${CONTACT_LENGTH} digits at most.`;
  return null;
}

// Digits only too, with the dashes put in for you (20150620 -> 2015-06-20).
// Typing the dashes yourself is fine; they are simply re-placed.
export function filterDateInput(raw) {
  const text = String(raw ?? "");
  const rejected = findDisallowed(text, /[0-9-]/);
  const digits = text.replace(/\D/g, "").slice(0, 8);
  let value = digits;
  if (digits.length > 6) value = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  else if (digits.length > 4) value = `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return { value, rejected };
}

export function dateNote(result) {
  if (result.rejected.length)
    return `Only numbers are allowed here (${describeChars(result.rejected)} removed). The dashes are added for you.`;
  return null;
}

export const DATE_YYYY_MM_DD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Required, YYYY-MM-DD, a real calendar date, not in the future.
export function dateFinal(value) {
  if (!value || !value.trim()) return "Date established is required.";
  if (!DATE_YYYY_MM_DD_REGEX.test(value)) return "Use the format YYYY-MM-DD (e.g., 2015-06-20).";
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  const isRealDate =
    parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
  if (!isRealDate) return "Enter a real, valid date.";
  if (parsed > new Date()) return "Date established can't be in the future.";
  return null;
}

// Shown as soon as there are enough digits to tell, not only when finished.
export function dateLive(value) {
  const v = value || "";
  if (v.length >= 7) {
    const month = Number(v.slice(5, 7));
    if (month < 1 || month > 12) return "The month must be between 01 and 12.";
  }
  if (v.length >= 10) {
    const day = Number(v.slice(8, 10));
    if (day < 1 || day > 31) return "The day must be between 01 and 31.";
    return dateFinal(v);
  }
  return null;
}

// --- consent ---------------------------------------------------------------

export const CONSENT_REQUIRED_MESSAGE =
  "Please tick this box to agree to the Terms and Conditions. You can't create an account without it.";

export function consentFinal(accepted) {
  return accepted ? null : CONSENT_REQUIRED_MESSAGE;
}

// --- whole-form -------------------------------------------------------------

// On-screen order, used to put the cursor on the first problem after Submit.
export const FIELD_ORDER = {
  individual: ["lastName", "firstName", "middleName", "email", "password", "confirmPassword", "acceptedTerms"],
  organization: [
    "orgName", "registrationNo", "dateEstablished", "orgContact",
    "lastName", "firstName", "email", "password", "confirmPassword", "acceptedTerms",
  ],
};

const clean = (errors) =>
  Object.fromEntries(Object.entries(errors).filter(([, message]) => message));

export function getLiveErrors(data, role) {
  const errors = {
    lastName: nameLive(data.lastName, "Last name"),
    firstName: nameLive(data.firstName, "First name"),
    email: emailLive(data.email),
    password: passwordLive(data.password),
    confirmPassword: confirmLive(data.confirmPassword, data.password),
  };
  if (role === "organization") {
    errors.orgName = orgNameLive(data.orgName);
    errors.registrationNo = registrationNoLive(data.registrationNo);
    errors.dateEstablished = dateLive(data.dateEstablished);
  } else {
    errors.middleName = nameLive(data.middleName, "Middle name");
  }
  return clean(errors);
}

// Live + final. Empty means every field is good (consent is checked apart).
export function getAllErrors(data, role) {
  const live = getLiveErrors(data, role);
  const errors = {
    lastName: nameFinal(data.lastName, "Last name"),
    firstName: nameFinal(data.firstName, "First name"),
    email: emailFinal(data.email),
    password: passwordFinal(data.password),
    confirmPassword: confirmFinal(data.confirmPassword, data.password),
  };
  if (role === "organization") {
    errors.orgName = orgNameFinal(data.orgName);
    errors.registrationNo = registrationNoFinal(data.registrationNo);
    errors.dateEstablished = dateFinal(data.dateEstablished);
    errors.orgContact = contactFinal(data.orgContact);
  } else {
    errors.middleName = nameFinal(data.middleName, "Middle name", { required: false });
  }
  return { ...clean(errors), ...live };
}