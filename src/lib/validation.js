// Shared validation helpers — plain functions, no JSX, reusable anywhere in the app.

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Same pattern already used in Farm Profile's validation — letters, spaces,
// periods, and hyphens only, kept identical here so name rules don't drift
// into two different regexes across the app.
export const NAME_REGEX = /^[a-zA-Z\s.-]+$/;
// At least one special character/symbol, for the added password requirement
export const SPECIAL_CHAR_REGEX = /[!@#$%^&*(),.?":{}|<>]/;

export function validateEmail(email) {
  if (!email.trim()) return "Email is required.";
  if (!EMAIL_REGEX.test(email)) return "Enter a valid email address.";
  return null;
}

export function validateRequired(value, label) {
  if (!value || !value.trim()) return `${label} is required.`;
  return null;
}

// For name fields specifically (first/last name) — required AND letters only,
// no digits. Kept separate from validateRequired, which is also used for
// fields like Registration No. or Date Established that legitimately need
// numbers.
export function validateName(value, label) {
  const requiredError = validateRequired(value, label);
  if (requiredError) return requiredError;
  if (!NAME_REGEX.test(value))
    return `${label} can only contain letters, spaces, periods, or hyphens — no numbers.`;
  return null;
}

export function validatePassword(password, minLength = 8) {
  if (!password) return "Password is required.";
  if (password.length < minLength) return `Use at least ${minLength} characters.`;
  if (!/[A-Za-z]/.test(password)) return "Include at least one letter.";
  if (!/[0-9]/.test(password)) return "Include at least one number.";
  if (!SPECIAL_CHAR_REGEX.test(password))
    return "Include at least one special character (e.g. ! @ # $ %).";
  return null;
}

export function validateConfirmPassword(confirmPassword, password) {
  if (!confirmPassword) return "Please confirm your password.";
  if (confirmPassword !== password) return "Passwords don't match.";
  return null;
}

export const DATE_YYYY_MM_DD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Required, must match YYYY-MM-DD exactly, and must be a real calendar date
// (rejects things like 2026-13-45 that match the format but don't exist),
// and can't be in the future — a founding date shouldn't be later than today.
export function validateDateEstablished(value) {
  if (!value || !value.trim()) return "Date established is required.";
  if (!DATE_YYYY_MM_DD_REGEX.test(value))
    return "Use the format YYYY-MM-DD (e.g., 2015-06-20).";

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  const isRealDate =
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day;
  if (!isRealDate) return "Enter a real, valid date.";

  if (parsed > new Date()) return "Date established can't be in the future.";

  return null;
}

// Runs every rule for a given form and returns an { field: message } object.
// An empty object means the form is valid.

export function validateLoginForm(data) {
  const errors = {};
  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;
  if (!data.password) errors.password = "Password is required.";
  return errors;
}

export function validateSignupForm(data) {
  const errors = {};

  const lastNameError = validateName(data.lastName, "Last name");
  if (lastNameError) errors.lastName = lastNameError;

  const firstNameError = validateName(data.firstName, "First name");
  if (firstNameError) errors.firstName = firstNameError;

  // Middle name is optional — no validation needed

  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(data.password);
  if (passwordError) errors.password = passwordError;

  const confirmError = validateConfirmPassword(
    data.confirmPassword,
    data.password
  );
  if (confirmError) errors.confirmPassword = confirmError;

  return errors;
}

export function validateOrganizationSignupForm(data) {
  const errors = {};

  const orgNameError = validateRequired(data.orgName, "Organization name");
  if (orgNameError) errors.orgName = orgNameError;

  const regNoError = validateRequired(data.registrationNo, "Registration number");
  if (regNoError) errors.registrationNo = regNoError;

  const dateError = validateDateEstablished(data.dateEstablished);
  if (dateError) errors.dateEstablished = dateError;

  const contactError = !data.orgContact.trim()
    ? "Contact number is required."
    : data.orgContact.length !== 11
    ? "Enter an 11-digit contact number."
    : null;
  if (contactError) errors.orgContact = contactError;

  const lastNameError = validateName(data.lastName, "Last name");
  if (lastNameError) errors.lastName = lastNameError;

  const firstNameError = validateName(data.firstName, "First name");
  if (firstNameError) errors.firstName = firstNameError;

  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(data.password);
  if (passwordError) errors.password = passwordError;

  return errors;
}

export function validateForgotForm(data) {
  const errors = {};
  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;
  return errors;
}

export function validateOtp(digits) {
  if (digits.some((digit) => !digit)) return "Enter all 6 digits.";
  return null;
}