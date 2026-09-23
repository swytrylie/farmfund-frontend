// Shared validation helpers — plain functions, no JSX, reusable anywhere in the app.

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  if (!email.trim()) return "Email is required.";
  if (!EMAIL_REGEX.test(email)) return "Enter a valid email address.";
  return null;
}

export function validateRequired(value, label) {
  if (!value || !value.trim()) return `${label} is required.`;
  return null;
}

export function validatePassword(password, minLength = 8) {
  if (!password) return "Password is required.";
  if (password.length < minLength) return `Use at least ${minLength} characters.`;
  if (!/[A-Za-z]/.test(password)) return "Include at least one letter.";
  if (!/[0-9]/.test(password)) return "Include at least one number.";
  return null;
}

export function validateConfirmPassword(confirmPassword, password) {
  if (!confirmPassword) return "Please confirm your password.";
  if (confirmPassword !== password) return "Passwords don't match.";
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

  const lastNameError = validateRequired(data.lastName, "Last name");
  if (lastNameError) errors.lastName = lastNameError;

  const firstNameError = validateRequired(data.firstName, "First name");
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

  const dateError = validateRequired(data.dateEstablished, "Date established");
  if (dateError) errors.dateEstablished = dateError;

  const contactError = !data.orgContact.trim()
    ? "Contact number is required."
    : data.orgContact.length !== 11
    ? "Enter an 11-digit contact number."
    : null;
  if (contactError) errors.orgContact = contactError;

  const lastNameError = validateRequired(data.lastName, "Last name");
  if (lastNameError) errors.lastName = lastNameError;

  const firstNameError = validateRequired(data.firstName, "First name");
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