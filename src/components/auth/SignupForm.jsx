import { useState } from "react";
import { User, Building2, Info } from "lucide-react";
import FormInput from "./FormInput";
import {
  validateSignupForm,
  validateOrganizationSignupForm,
} from "../../lib/validation";
import { apiRequest } from "../../api";

const ROLE_OPTIONS = [
  {
    value: "individual",
    icon: User,
    title: "Individual",
    caption: "A single lender or personal account",
  },
  {
    value: "organization",
    icon: Building2,
    title: "Organization",
    caption: "A cooperative and lending group",
  },
];

// Small uppercase label used above every field on this form
function FieldLabel({ children }) {
  return (
    <label className="text-xs font-bold text-white uppercase tracking-wider mb-1 block">
      {children}
    </label>
  );
}

export default function SignupForm({ onSwitchMode, initialRole }) {
  const [selectedRole, setSelectedRole] = useState(initialRole || "individual");
  const isOrganization = selectedRole === "organization";

  // One combined state object covering fields from both variants, so switching
  // the toggle never wipes out whatever the person already typed.
  const [data, setData] = useState({
    lastName: "",
    firstName: "",
    middleName: "",
    email: "",
    password: "",
    confirmPassword: "",
    orgName: "",
    registrationNo: "",
    dateEstablished: "",
    orgContact: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
    const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

   const update = (field) => (e) => {
    const value = e.target.value;
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerError("");
  };

  // Organization contact number: digits only, no letters/symbols/minus signs,
  // capped at 11 characters (standard PH mobile number length).
  const updateOrgContact = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 11);
    setData((prev) => ({ ...prev, orgContact: digitsOnly }));
    setErrors((prev) => ({ ...prev, orgContact: undefined }));
  };

    async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    const validationErrors = isOrganization
      ? validateOrganizationSignupForm(data)
      : validateSignupForm(data);
    setErrors(validationErrors);
    setServerError("");
    if (Object.keys(validationErrors).length > 0) return;

    // No backend route for organizations yet, so this stays a design-only flow.
    if (isOrganization) {
      console.log("Organization signup (design only):", data.orgName);
      onSwitchMode("submitted-organization", data.orgName);
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: {
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.trim(),
          password: data.password,
        },
      });
      onSwitchMode("account-success", selectedRole);
    } catch (err) {
      const detail = Array.isArray(err.details) && err.details[0]?.message;
      setServerError(detail || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-white text-center">
        Create your account
      </h2>
      <p className="mt-1 text-center text-sm text-white/70">
        Choose the account type that fits how you'll use the portal.
      </p>

      {/* Account type toggle */}
      <div className="grid grid-cols-2 gap-3 my-5">
        {ROLE_OPTIONS.map(({ value, icon: Icon, title, caption }) => {
          const isSelected = selectedRole === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setSelectedRole(value)}
              className={`rounded-xl p-4 text-center transition ${
                isSelected ? "bg-[#e2f7e2]" : "bg-white hover:shadow-lg"
              }`}
            >
              <Icon size={26} className="mx-auto text-gray-900" />
              <p className="mt-2 font-bold text-gray-900 text-sm">{title}</p>
              <p className="mt-1 text-xs text-gray-500 leading-snug">
                {caption}
              </p>
            </button>
          );
        })}
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {isOrganization ? (
          <>
            {/* Organization name */}
            <div>
              <FieldLabel>Organization Name</FieldLabel>
              <FormInput
                placeholder="e.g., Kasama Farmers Association"
                value={data.orgName}
                onChange={update("orgName")}
                error={errors.orgName}
                compact
              />
            </div>

            {/* Registration No. / Date Established */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Registration No.</FieldLabel>
                <FormInput
                  placeholder="e.g., CDA-2015-00812)"
                  value={data.registrationNo}
                  onChange={update("registrationNo")}
                  error={errors.registrationNo}
                  compact
                />
              </div>
              <div>
                <FieldLabel>Date Established</FieldLabel>
                <FormInput
                  placeholder="YYYY-MM-DD"
                  value={data.dateEstablished}
                  onChange={update("dateEstablished")}
                  error={errors.dateEstablished}
                  compact
                />
              </div>
            </div>

            {/* Organization contact info */}
            <div>
              <FieldLabel>Organization Contact Info</FieldLabel>
              <FormInput
                type="tel"
                placeholder="e.g., +63 9XX XXX XXXX"
                value={data.orgContact}
                onChange={updateOrgContact}
                error={errors.orgContact}
                compact
              />
            </div>

            {/* Last name / First name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Last Name</FieldLabel>
                <FormInput
                  placeholder="e.g., Lauron"
                  value={data.lastName}
                  onChange={update("lastName")}
                  error={errors.lastName}
                  compact
                />
              </div>
              <div>
                <FieldLabel>First Name</FieldLabel>
                <FormInput
                  placeholder="e.g., Nelmar"
                  value={data.firstName}
                  onChange={update("firstName")}
                  error={errors.firstName}
                  compact
                />
              </div>
            </div>

            {/* Email / Create password */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Email Address</FieldLabel>
                <FormInput
                  type="email"
                  placeholder="e.g., owner@kfacoop.ph"
                  value={data.email}
                  onChange={update("email")}
                  error={errors.email}
                  compact
                />
              </div>
              <div>
                <FieldLabel>Create Password</FieldLabel>
                <FormInput
                  placeholder="Create a password"
                  value={data.password}
                  onChange={update("password")}
                  error={errors.password}
                  showToggle
                  visible={showPassword}
                  onToggleVisible={() => setShowPassword((p) => !p)}
                  compact
                />
              </div>
            </div>

            {/* Info banner */}
            <div className="bg-[#e2f7e2] rounded-lg p-3 flex items-start gap-2.5">
              <Info size={16} className="text-emerald-700 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-800 leading-relaxed">
                As the form completer, you'll be assigned as the Owner
                (Admin). You can invite Financial Managers or staff later —
                others cannot sign up themselves.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Last name / First name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Last Name</FieldLabel>
                <FormInput
                  placeholder="e.g., Lauron"
                  value={data.lastName}
                  onChange={update("lastName")}
                  error={errors.lastName}
                  compact
                />
              </div>
              <div>
                <FieldLabel>First Name</FieldLabel>
                <FormInput
                  placeholder="e.g., Nelmar"
                  value={data.firstName}
                  onChange={update("firstName")}
                  error={errors.firstName}
                  compact
                />
              </div>
            </div>

            {/* Middle name / Email */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Middle Name (Optional)</FieldLabel>
                <FormInput
                  placeholder="e.g., Lauron"
                  value={data.middleName}
                  onChange={update("middleName")}
                  compact
                />
              </div>
              <div>
                <FieldLabel>Email Address</FieldLabel>
                <FormInput
                  type="email"
                  placeholder="e.g., owner@kfacoop.ph"
                  value={data.email}
                  onChange={update("email")}
                  error={errors.email}
                  compact
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <FieldLabel>Create Password</FieldLabel>
              <FormInput
                placeholder="Create a password"
                value={data.password}
                onChange={update("password")}
                error={errors.password}
                showToggle
                visible={showPassword}
                onToggleVisible={() => setShowPassword((p) => !p)}
              />
            </div>

            {/* Confirm password */}
            <div>
              <FieldLabel>Confirm Password</FieldLabel>
              <FormInput
                placeholder="Create a password"
                value={data.confirmPassword}
                onChange={update("confirmPassword")}
                error={errors.confirmPassword}
                showToggle
                visible={showConfirmPassword}
                onToggleVisible={() => setShowConfirmPassword((p) => !p)}
              />
            </div>
          </>
        )}

           {serverError && (
          <p className="text-sm text-red-300 text-center">{serverError}</p>
        )}

        {statusMessage && (
          <p className="text-sm text-[#8fe28f] text-center">{statusMessage}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-lg bg-[#5bc252] text-white font-bold text-base hover:bg-[#4caa46] active:bg-[#409139] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account…" : "Submit"}
        </button>
      </form>

      <p className="mt-4 text-center text-white/90">
        Already have an account?{" "}
        <button
          onClick={() => onSwitchMode("login")}
          className="font-bold text-white hover:underline"
        >
          Log in
        </button>
      </p>
    </>
  );
}