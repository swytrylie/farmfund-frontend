import { useState } from "react";
import { User, Building2, Info } from "lucide-react";
import FormInput from "./FormInput";
import PasswordStrengthField from "./PasswordStrengthField";
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

  // Shown after a successful register() call — register() no longer logs
  // anyone in immediately, since the account now genuinely needs to be
  // verified first. pendingOrgName is only ever set for the organization
  // path, carrying register()'s cooperative name through to the final
  // hand-off, since verify-signup's own response doesn't include it.
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [pendingOrgName, setPendingOrgName] = useState(null);

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

  // Date Established: digits only, dashes inserted automatically as you
  // type (2015062 0 → 2015-06-20) — letters simply can't be typed in at
  // all, since anything non-numeric is stripped before it ever reaches state.
  const updateDateEstablished = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 8); // YYYYMMDD
    let formatted = digitsOnly;
    if (digitsOnly.length > 4) {
      formatted = `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4)}`;
    }
    if (digitsOnly.length > 6) {
      formatted = `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 6)}-${digitsOnly.slice(6)}`;
    }
    setData((prev) => ({ ...prev, dateEstablished: formatted }));
    setErrors((prev) => ({ ...prev, dateEstablished: undefined }));
  };

  // "Use suggested strong password": fills Password AND Confirm Password, and
  // reveals both so the person can actually see and save what was generated.
  const handleUseSuggested = (generated) => {
    setData((prev) => ({ ...prev, password: generated, confirmPassword: generated }));
    setErrors((prev) => ({ ...prev, password: undefined, confirmPassword: undefined }));
    setServerError("");
    setShowPassword(true);
    setShowConfirmPassword(true);
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

    setLoading(true);
    try {
      if (isOrganization) {
        // register() creates the User (isEmailVerified: false), a new
        // Cooperative (status: "pending", awaiting admin approval), and
        // links them as its owner — all in one real backend step. It
        // genuinely can't log in yet though, until the OTP just emailed
        // to them is confirmed — so this no longer calls login()
        // immediately the way it used to.
        const registerResult = await apiRequest("/api/auth/register", {
          method: "POST",
          body: {
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            email: data.email.trim(),
            password: data.password,
            orgName: data.orgName.trim(),
          },
        });
        setPendingOrgName(registerResult.cooperative?.name);
        setAwaitingVerification(true);
        return;
      }

      await apiRequest("/api/auth/register", {
        method: "POST",
        body: {
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.trim(),
          password: data.password,
        },
      });
      setAwaitingVerification(true);
    } catch (err) {
      const detail = Array.isArray(err.details) && err.details[0]?.message;
      setServerError(detail || err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (verifying) return;
    setOtpError("");
    setVerifying(true);
    try {
      // verify-signup's response is a REAL session, the same shape
      // login() returns — flipping isEmailVerified to true and logging
      // them in happen together, server-side, in one call.
      const result = await apiRequest("/api/auth/verify-signup", {
        method: "POST",
        body: { email: data.email.trim(), code: otpCode },
      });

      if (isOrganization) {
        onSwitchMode("org-signup-success", {
          accessToken: result.accessToken,
          user: {
            ...result.user,
            accountType: "organization",
            orgName: pendingOrgName,
          },
        });
      } else {
        onSwitchMode("account-success", selectedRole);
      }
    } catch (err) {
      setOtpError(err.message || "Invalid or expired code.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleResendOtp() {
    if (resending) return;
    setResending(true);
    setOtpError("");
    try {
      await apiRequest("/api/auth/resend-signup-otp", {
        method: "POST",
        body: { email: data.email.trim() },
      });
      setStatusMessage("A new code has been sent to your email.");
    } catch (err) {
      setOtpError(err.message || "Couldn't resend the code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  if (awaitingVerification) {
    return (
      <>
        <h2 className="text-2xl font-bold text-white text-center">Check your email</h2>
        <p className="mt-1 text-center text-sm text-white/70">
          We sent a 6-digit code to <strong>{data.email.trim()}</strong>. Enter it below to finish creating your account.
        </p>

        <form className="space-y-4 mt-6" onSubmit={handleVerifyOtp} noValidate>
          <div>
            <FieldLabel>Verification Code</FieldLabel>
            <FormInput
              placeholder="123456"
              value={otpCode}
              onChange={(e) => {
                setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setOtpError("");
              }}
              error={otpError}
              compact
            />
          </div>

          {statusMessage && <p className="text-sm text-green-300">{statusMessage}</p>}

          <button
            type="submit"
            disabled={verifying || otpCode.length !== 6}
            className="w-full bg-[#5bc252] hover:bg-[#4d9e45] text-white font-semibold rounded-xl py-3 transition-colors disabled:opacity-60"
          >
            {verifying ? "Verifying…" : "Verify and continue"}
          </button>

          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resending}
            className="w-full text-center text-sm text-white/70 hover:text-white underline disabled:opacity-60"
          >
            {resending ? "Resending…" : "Didn't get a code? Resend"}
          </button>
        </form>
      </>
    );
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
                  onChange={updateDateEstablished}
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
                <PasswordStrengthField
                  placeholder="Create a password"
                  value={data.password}
                  onChange={update("password")}
                  error={errors.password}
                  visible={showPassword}
                  onToggleVisible={() => setShowPassword((p) => !p)}
                  onUseSuggested={handleUseSuggested}
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
              <PasswordStrengthField
                placeholder="Create a password"
                value={data.password}
                onChange={update("password")}
                error={errors.password}
                visible={showPassword}
                onToggleVisible={() => setShowPassword((p) => !p)}
                onUseSuggested={handleUseSuggested}
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