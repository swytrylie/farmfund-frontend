// Shared validation helpers — plain functions, no JSX, reusable anywhere in the app.
//
// The sign-up rules (names, email, password, organization fields, consent)
// live in signupValidation.js, which also has the "live" per-keystroke checks;
// the functions here are the same rules under their older names, so every form
// that already imports from this file keeps working.

import {
  SYMBOL_REGEX,
  DATE_YYYY_MM_DD_REGEX as DATE_REGEX,
  nameLive,
  nameFinal,
  passwordLive,
  passwordFinal,
  confirmFinal,
  dateFinal,
  getAllErrors,
} from "./signupValidation";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Letters from any language (Peña, Muñoz), spaces, apostrophes, hyphens and
// periods — the same set the server accepts for names.
export const NAME_REGEX = /^[\p{L}\p{M}][\p{L}\p{M} '’.-]*$/u;
// Any symbol a password may contain (the ASCII punctuation).
export const SPECIAL_CHAR_REGEX = SYMBOL_REGEX;
export const DATE_YYYY_MM_DD_REGEX = DATE_REGEX;

// Deliberately lenient ("looks like an email"): used by Login and Forgot
// password, where an existing account must never be turned away because of a
// stricter rule. The sign-up form checks email more closely (emailLive /
// emailFinal in signupValidation.js).
export function validateEmail(email) {
  if (!email.trim()) return "Email is required.";
  if (!EMAIL_REGEX.test(email)) return "Enter a valid email address.";
  return null;
}

export function validateRequired(value, label) {
  if (!value || !value.trim()) return `${label} is required.`;
  return null;
}

// First/last name: required, letters (any language), spaces, apostrophes,
// hyphens and periods — no numbers or other symbols.
export function validateName(value, label) {
  return nameLive(value || "", label) || nameFinal(value, label);
}

export function validatePassword(password, minLength = 8) {
  return passwordLive(password || "") || passwordFinal(password, minLength);
}

export function validateConfirmPassword(confirmPassword, password) {
  return confirmFinal(confirmPassword, password);
}

export function validateDateEstablished(value) {
  return dateFinal(value);
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
  return getAllErrors(data, "individual");
}

export function validateOrganizationSignupForm(data) {
  return getAllErrors(data, "organization");
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