import { useEffect, useRef, useState } from "react";
import { User, Building2, Info } from "lucide-react";
import FormInput from "./FormInput";
import PasswordStrengthField from "./PasswordStrengthField";
import TermsModal from "./TermsModal";
import {
  FIELD_ORDER,
  getLiveErrors,
  getAllErrors,
  consentFinal,
  filterContactInput,
  contactNote,
  filterDateInput,
  dateNote,
} from "../../lib/signupValidation";
import { TERMS_VERSION } from "../../lib/terms";
import { runAfterPointerRelease } from "../../lib/afterPointer";
import { apiRequest } from "../../api";

// How long a "that character was removed" note stays on screen.
const NOTE_MS = 4000;

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
function FieldLabel({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-bold text-white uppercase tracking-wider mb-1 block">
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
  // How feedback works (rules live in lib/signupValidation.js):
  //  - LIVE problems ("that character isn't allowed") show at once, as you type.
  //  - Everything else ("required", "incomplete") shows once you leave the
  //    field (touched), or for every field after Submit (submitted).
  // Nothing is stored as an error: it is worked out from the current values on
  // every render, so a message always matches what is in the box right now.
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  // Short-lived notes about text that was dropped as it was typed or pasted
  // (letters in the contact number, for instance). A note stays for a few
  // seconds — long enough to read while still typing — or until the person
  // leaves that field.
  const [notes, setNotes] = useState({});
  const noteTimers = useRef({});
  const [accepted, setAccepted] = useState(false);
  const [consentTouched, setConsentTouched] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
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

  const liveErrors = getLiveErrors(data, selectedRole);
  const allErrors = getAllErrors(data, selectedRole);
  const consentError = consentFinal(accepted);

  // What to show under a field right now.
  const errorFor = (field) =>
    liveErrors[field] || notes[field] || (submitted || touched[field] ? allErrors[field] : undefined);
  // Filled in and valid -> green border.
  const isGood = (field) => !!data[field] && !allErrors[field];
  // Leaving a field reveals its "required / incomplete" message. If the person
  // left it by pressing something (Submit, the consent box), the message waits
  // until the press is finished so the page doesn't shift under their click.
  const touch = (field) => () =>
    runAfterPointerRelease(() => {
      clearNote(field);
      setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
    });
  const idFor = (field) => `signup-${field}`;

  useEffect(() => {
    const timers = noteTimers.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

  const clearNote = (field) => {
    clearTimeout(noteTimers.current[field]);
    setNotes((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };
  const showNote = (field, message) => {
    clearTimeout(noteTimers.current[field]);
    setNotes((prev) => ({ ...prev, [field]: message }));
    noteTimers.current[field] = setTimeout(() => clearNote(field), NOTE_MS);
  };

  const update = (field) => (e) => {
    const value = e.target.value;
    setData((prev) => ({ ...prev, [field]: value }));
    setServerError("");
  };

  // Organization contact number: digits only, up to 11. Anything else that is
  // typed or pasted is dropped AND the person is told so straight away.
  const updateOrgContact = (e) => {
    const result = filterContactInput(e.target.value);
    setData((prev) => ({ ...prev, orgContact: result.value }));
    const note = contactNote(result);
    if (note) showNote("orgContact", note);
    setServerError("");
  };

  // Date Established: digits only, dashes put in for you (20150620 ->
  // 2015-06-20). Other characters are dropped and the person is told.
  const updateDateEstablished = (e) => {
    const result = filterDateInput(e.target.value);
    setData((prev) => ({ ...prev, dateEstablished: result.value }));
    const note = dateNote(result);
    if (note) showNote("dateEstablished", note);
    setServerError("");
  };

  // "Use suggested strong password": fills Password AND Confirm Password, and
  // reveals both so the person can actually see and save what was generated.
  const handleUseSuggested = (generated) => {
    setData((prev) => ({ ...prev, password: generated, confirmPassword: generated }));
    setServerError("");
    setShowPassword(true);
    setShowConfirmPassword(true);
  };

  const chooseRole = (role) => {
    setSelectedRole(role);
    Object.keys(noteTimers.current).forEach(clearNote);
    setServerError("");
  };

  const toggleConsent = (e) => {
    setAccepted(e.target.checked);
    setConsentTouched(true);
    setServerError("");
  };

  const agreeFromModal = () => {
    setAccepted(true);
    setConsentTouched(true);
    setTermsOpen(false);
  };


  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    setSubmitted(true);
    setConsentTouched(true);
    setServerError("");

    // Stop at the first problem and put the cursor there. The consent box
    // counts: without it the account cannot be created.
    const firstProblem = FIELD_ORDER[selectedRole].find((field) =>
      field === "acceptedTerms" ? consentError : allErrors[field]
    );
    if (firstProblem) {
      document.getElementById(idFor(firstProblem))?.focus();
      return;
    }

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
            phone: data.orgContact,
            acceptedTerms: true,
            termsVersion: TERMS_VERSION,
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
          acceptedTerms: true,
          termsVersion: TERMS_VERSION,
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
      // For an individual account, verifying the email is the last step.
      // For an organization, the server confirms the email but does NOT
      // start a session: an admin has to approve the cooperative first, so
      // the answer is { pendingApproval: true, orgName }.
      const result = await apiRequest("/api/auth/verify-signup", {
        method: "POST",
        body: { email: data.email.trim(), code: otpCode },
      });

      if (isOrganization && result?.pendingApproval) {
        onSwitchMode("submitted-organization", result.orgName || pendingOrgName);
      } else if (isOrganization) {
        // Not expected any more (an organization always waits for approval),
        // but if the server ever does hand back a session, honor it.
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

  const consentShown = submitted || consentTouched ? consentError : null;
  const hasProblems = Object.keys(allErrors).length > 0 || !!consentError;

  // One labelled text box wired to the live/final feedback above.
  const textField = (field, label, props = {}) => (
    <div>
      <FieldLabel htmlFor={idFor(field)}>{label}</FieldLabel>
      <FormInput
        id={idFor(field)}
        value={data[field]}
        onChange={update(field)}
        onBlur={touch(field)}
        error={errorFor(field)}
        success={isGood(field)}
        compact
        {...props}
      />
    </div>
  );

  const passwordField = (compact) => (
    <div>
      <FieldLabel htmlFor={idFor("password")}>Create Password</FieldLabel>
      <PasswordStrengthField
        id={idFor("password")}
        placeholder="Create a password"
        value={data.password}
        onChange={update("password")}
        onBlur={touch("password")}
        error={errorFor("password")}
        success={isGood("password")}
        visible={showPassword}
        onToggleVisible={() => setShowPassword((p) => !p)}
        onUseSuggested={handleUseSuggested}
        compact={compact}
      />
    </div>
  );

  const confirmMatches = !!data.confirmPassword && !allErrors.confirmPassword;
  const confirmField = (compact) => (
    <div>
      <FieldLabel htmlFor={idFor("confirmPassword")}>Confirm Password</FieldLabel>
      <FormInput
        id={idFor("confirmPassword")}
        placeholder="Re-enter your password"
        value={data.confirmPassword}
        onChange={update("confirmPassword")}
        onBlur={touch("confirmPassword")}
        error={errorFor("confirmPassword")}
        success={confirmMatches}
        hint={confirmMatches ? "Passwords match." : undefined}
        showToggle
        visible={showConfirmPassword}
        onToggleVisible={() => setShowConfirmPassword((p) => !p)}
        autoComplete="new-password"
        compact={compact}
      />
    </div>
  );

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
              onClick={() => chooseRole(value)}
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
            {textField("orgName", "Organization Name", {
              placeholder: "e.g., Kasama Farmers Association",
            })}

            {/* Registration No. / Date Established */}
            <div className="grid grid-cols-2 gap-4">
              {textField("registrationNo", "Registration No.", {
                placeholder: "e.g., CDA-2015-00812",
              })}
              {textField("dateEstablished", "Date Established", {
                placeholder: "YYYY-MM-DD",
                onChange: updateDateEstablished,
                inputMode: "numeric",
                hint: "Numbers only — dashes are added for you.",
              })}
            </div>

            {/* Organization contact info */}
            {textField("orgContact", "Organization Contact Info", {
              type: "tel",
              placeholder: "e.g., 09171234567",
              onChange: updateOrgContact,
              hint: "11 digits, numbers only.",
            })}

            {/* Last name / First name */}
            <div className="grid grid-cols-2 gap-4">
              {textField("lastName", "Last Name", { placeholder: "e.g., Lauron" })}
              {textField("firstName", "First Name", { placeholder: "e.g., Nelmar" })}
            </div>

            {/* Email */}
            {textField("email", "Email Address", {
              type: "email",
              placeholder: "e.g., owner@kfacoop.ph",
              autoComplete: "email",
            })}

            {/* Password / Confirm password */}
            <div className="grid grid-cols-2 gap-4">
              {passwordField(true)}
              {confirmField(true)}
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
              {textField("lastName", "Last Name", { placeholder: "e.g., Lauron" })}
              {textField("firstName", "First Name", { placeholder: "e.g., Nelmar" })}
            </div>

            {/* Middle name / Email */}
            <div className="grid grid-cols-2 gap-4">
              {textField("middleName", "Middle Name (Optional)", { placeholder: "e.g., Lauron" })}
              {textField("email", "Email Address", {
                type: "email",
                placeholder: "e.g., owner@kfacoop.ph",
                autoComplete: "email",
              })}
            </div>

            {/* Password */}
            {passwordField(false)}

            {/* Confirm password */}
            {confirmField(false)}
          </>
        )}

        {/* Consent: the account cannot be created until this is ticked */}
        <div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              id={idFor("acceptedTerms")}
              type="checkbox"
              checked={accepted}
              onChange={toggleConsent}
              aria-invalid={consentShown ? "true" : undefined}
              aria-describedby={consentShown ? "signup-acceptedTerms-message" : undefined}
              className={`mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[#5bc252] ${
                consentShown ? "outline outline-2 outline-offset-2 outline-red-400" : ""
              }`}
            />
            <span className="text-sm leading-snug text-white/90">
              I have read and agree to the{" "}
              <button
                type="button"
                onClick={(e) => {
                  // Opens the terms; must not also tick the box it sits inside.
                  e.preventDefault();
                  e.stopPropagation();
                  setTermsOpen(true);
                }}
                className="font-bold text-white underline hover:text-[#8fe28f]"
              >
                Terms and Conditions
              </button>
              , and I consent to FarmFund collecting and using my personal data as described there.
            </span>
          </label>
          <div aria-live="polite">
            {consentShown && (
              <p id="signup-acceptedTerms-message" className="mt-1.5 text-xs text-red-300">
                {consentShown}
              </p>
            )}
          </div>
        </div>

        {submitted && hasProblems && (
          <p className="text-sm text-red-300 text-center">
            Please fix the highlighted fields before continuing.
          </p>
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

      {termsOpen && <TermsModal onClose={() => setTermsOpen(false)} onAgree={agreeFromModal} />}

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