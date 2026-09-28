// Validation helpers for the Farm Profile page — plain functions, no JSX,
// following the same pattern as lib/validation.js used by the auth forms.

export const FULL_NAME_REGEX = /^[a-zA-Z\s.-]+$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PH_PHONE_REGEX = /^(?:\+63|0)9\d{9}$/;
export const NATIONAL_ID_REGEX = /^(\d{12}|\d{4}-\d{4}-\d{4})$/;
export const FARM_SIZE_REGEX = /^\d+(\.\d{1,2})?$/;
// At least 1 number and 1 special character, 8+ characters total
export const NEW_PASSWORD_REGEX = /^(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

export function validateFullName(value) {
  if (!value.trim()) return "Full name is required.";
  if (!FULL_NAME_REGEX.test(value))
    return "Use letters, spaces, periods, or hyphens only.";
  return null;
}

export function validateEmail(value) {
  if (!value.trim()) return "Email is required.";
  if (!EMAIL_REGEX.test(value)) return "Enter a valid email address.";
  return null;
}

export function validatePhone(value) {
  if (!value.trim()) return "Phone number is required.";
  if (!PH_PHONE_REGEX.test(value))
    return "Enter a valid PH mobile number (e.g., 09171234567).";
  return null;
}

export function validateNationalId(value) {
  if (!value.trim()) return "National ID is required.";
  if (!NATIONAL_ID_REGEX.test(value))
    return "Use 12 digits or the XXXX-XXXX-XXXX format.";
  return null;
}

export function validateFarmName(value) {
  if (!value.trim()) return "Farm name is required.";
  if (value.length > 60) return "Keep it under 60 characters.";
  return null;
}

export function validateLocation(value) {
  if (!value.trim()) return "Location is required.";
  if (!value.includes(","))
    return 'Use the format "City, Province" (e.g., Dagupan City, Pangasinan).';
  return null;
}

export function validateFarmSize(value) {
  if (!value.trim()) return "Farm size is required.";
  if (!FARM_SIZE_REGEX.test(value)) return "Enter a valid number (e.g., 2.5).";
  if (parseFloat(value) <= 0) return "Farm size must be greater than 0.";
  return null;
}

export function validateFarmType(value) {
  if (!value.trim()) return "Farm type is required.";
  return null;
}

export function validateNewPassword(value) {
  if (!value) return "New password is required.";
  if (!NEW_PASSWORD_REGEX.test(value))
    return "Use 8+ characters with at least 1 number and 1 special character.";
  return null;
}

export function validateConfirmPassword(confirm, newPassword) {
  if (!confirm) return "Please confirm your new password.";
  if (confirm !== newPassword) return "Passwords don't match.";
  return null;
}

// Weak / Medium / Strong, based on length + how many character classes are present
export function getPasswordStrength(value) {
  if (!value) return { label: "", score: 0 };

  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[a-z]/.test(value)) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) score++;

  if (score <= 2) return { label: "Weak", score: 1 };
  if (score <= 4) return { label: "Medium", score: 2 };
  return { label: "Strong", score: 3 };
}

// Which profile fields count toward "Profile Strength" — kept in one place
// so the calculation and the form fields can never silently drift apart.
export const PROFILE_STRENGTH_FIELDS = [
  ["personalInfo", "fullName"],
  ["personalInfo", "email"],
  ["personalInfo", "phone"],
  ["personalInfo", "nationalId"],
  ["farmDetails", "farmName"],
  ["farmDetails", "location"],
  ["farmDetails", "farmSizeHectares"],
  ["farmDetails", "farmType"],
  ["farmDetails", "primaryCrops"],
  ["farmDetails", "livestock"],
  ["registration", "kfaRegNo"],
  ["registration", "rsbsaId"],
  ["registration", "registeredSince"],
  ["registration", "membershipType"],
  ["registration", "philGapIdNumber"],
  ["registration", "landTitleRegistryNumber"],
  ["registration", "coopStanding"],
];

export function calculateProfileStrength(profile) {
  const filled = PROFILE_STRENGTH_FIELDS.filter(
    ([section, field]) => profile[section]?.[field]?.toString().trim()
  ).length;
  return Math.round((filled / PROFILE_STRENGTH_FIELDS.length) * 100);
}