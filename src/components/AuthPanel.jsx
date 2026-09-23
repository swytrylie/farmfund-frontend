import { useEffect, useState } from "react";
import { X } from "lucide-react";
import LoginForm from "./auth/LoginForm";
import RoleSelectForm from "./auth/RoleSelectForm";
import SignupForm from "./auth/SignupForm";
import ForgotPasswordForm from "./auth/ForgotPasswordForm";
import OTPForm from "./auth/OTPForm";
import NewPasswordForm from "./auth/NewPasswordForm";
import LockedForm from "./auth/LockedForm";
import AccountSuccessForm from "./auth/AccountSuccessForm";
import OrganizationSubmittedForm from "./auth/OrganizationSubmittedForm";

export default function AuthPanel({
  mode,
  otpEmail,
  accountType,
  organizationName,
  onSelectRole,
  onClose,
  onSwitchMode,
  attemptsRemaining,
  onFailedAttempt,
  onLoginSuccess,
  lockoutSecondsLeft,
  onSimulateEscalation,
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 250);
  };

  // The signup form is taller/narrower than every other auth screen, so it
  // gets its own footprint instead of the shared 600x650 used elsewhere.
  const isSignup = mode === "signup";
  const isSuccess = mode === "account-success" || mode === "submitted-organization";
  const cardSizeClasses = isSignup
    ? "w-[520px] min-h-[620px] p-6"
    : isSuccess
    ? "w-[520px] min-h-[580px] p-10"
    : "w-[600px] h-[650px] p-10";

  return (
    <div className="fixed inset-0 z-50">
      {/* Dim backdrop over the hero, click to close */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Panel positioned on the right side of the screen */}
      <div
        className={`absolute inset-y-0 right-0 flex items-center justify-center p-4 sm:p-8 transition-all duration-300 ease-out ${
          visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
        }`}
      >
        {/* Glassmorphism card — footprint varies slightly for the signup form, see above */}
        <div
          className={`relative max-w-[90vw] max-h-[90vh] flex flex-col justify-center backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-2xl overflow-y-auto ${cardSizeClasses}`}
        >
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>

          {mode === "login" && (
            <LoginForm
              onSwitchMode={onSwitchMode}
              attemptsRemaining={attemptsRemaining}
              onFailedAttempt={onFailedAttempt}
              onLoginSuccess={onLoginSuccess}
            />
          )}
          {mode === "signup-role" && (
            <RoleSelectForm onSelectRole={onSelectRole} onSwitchMode={onSwitchMode} />
          )}
          {mode === "signup" && (
            <SignupForm onSwitchMode={onSwitchMode} initialRole={accountType} />
          )}
          {mode === "forgot-password" && (
            <ForgotPasswordForm onSwitchMode={onSwitchMode} />
          )}
          {mode === "otp" && (
            <OTPForm email={otpEmail} onSwitchMode={onSwitchMode} />
          )}
          {mode === "new-password" && (
            <NewPasswordForm onSwitchMode={onSwitchMode} />
          )}
          {mode === "locked" && (
            <LockedForm
              secondsLeft={lockoutSecondsLeft}
              onReturnToLogin={() => onSwitchMode("login")}
              onSimulateEscalation={onSimulateEscalation}
            />
          )}
          {mode === "account-success" && (
            <AccountSuccessForm
              accountType={accountType}
              onContinue={() => onSwitchMode("login")}
            />
          )}
          {mode === "submitted-organization" && (
            <OrganizationSubmittedForm
              organizationName={organizationName}
              onBackToLogin={() => onSwitchMode("login")}
            />
          )}
        </div>
      </div>
    </div>
  );
}