import { useState } from "react";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";

// One reusable input for every form in the auth flow: optional left icon,
// optional password show/hide toggle, an optional Caps Lock warning, and an
// error message underneath.
//
// Usage:
//   <FormInput icon={Mail} type="email" placeholder="Email"
//              value={data.email} onChange={update("email")} error={errors.email} />
//
//   <FormInput icon={Lock} placeholder="Password" value={data.password}
//              onChange={update("password")} error={errors.password}
//              showToggle visible={showPassword} onToggleVisible={() => setShowPassword(p => !p)}
//              capsLockWarning autoComplete="current-password" />

// Browsers paint autofilled fields with their own yellow/blue background.
// These classes repaint it white so autofilled inputs match the normal ones
// (Chrome/Edge/Safari use :-webkit-autofill, Firefox uses :autofill).
const AUTOFILL_CLASSES = [
  "[&:-webkit-autofill]:[box-shadow:inset_0_0_0_1000px_#fff]",
  "[&:-webkit-autofill]:[-webkit-text-fill-color:#111827]",
  "[&:-webkit-autofill:focus]:[box-shadow:inset_0_0_0_1000px_#fff,0_0_0_2px_#42BD41]",
  "[&:autofill]:[box-shadow:inset_0_0_0_1000px_#fff]",
  "[&:autofill:focus]:[box-shadow:inset_0_0_0_1000px_#fff,0_0_0_2px_#42BD41]",
].join(" ");

// Password-manager and email-alias extensions (Bitwarden, 1Password, LastPass,
// Proton Pass, Dashlane...) sometimes attach their own popups to plain text
// fields like names. These attributes ask them to leave such fields alone.
// Email fields and password fields are deliberately left out, so saved-login
// autofill and password saving keep working.
const EXTENSION_IGNORE_ATTRS = {
  "data-lpignore": "true",
  "data-1p-ignore": "true",
  "data-bwignore": "true",
  "data-protonpass-ignore": "true",
  "data-form-type": "other",
};

export default function FormInput({
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  showToggle = false,
  visible = false,
  onToggleVisible,
  compact = false, // true for fields sharing a 2-column row (smaller text/icons)
  onFocus,
  onBlur,
  autoComplete,
  capsLockWarning = false, // show a "Caps Lock is ON" pill under the field
}) {
  const [capsLockOn, setCapsLockOn] = useState(false);

  const inputType = showToggle ? (visible ? "text" : "password") : type;
  const extensionAttrs =
    !showToggle && !autoComplete && (type === "text" || type === "tel")
      ? EXTENSION_IGNORE_ATTRS
      : {};
  const iconSize = compact ? 18 : 20;

  const leftPadding = Icon ? (compact ? "pl-11" : "pl-12") : "pl-4";
  const rightPadding = showToggle ? (compact ? "pr-10" : "pr-12") : "pr-4";

  function handleKey(e) {
    if (capsLockWarning && e.getModifierState) {
      setCapsLockOn(e.getModifierState("CapsLock"));
    }
  }

  function handleBlur(e) {
    setCapsLockOn(false);
    onBlur?.(e);
  }

  return (
    <div>
      {/* Inner wrapper holds ONLY the input and its icons, so the icons stay
          vertically centered on the input when a message appears below. */}
      <div className="relative">
        {Icon && (
          <Icon
            size={iconSize}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        )}

        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={handleBlur}
          onKeyDown={handleKey}
          onKeyUp={handleKey}
          autoComplete={autoComplete}
          {...extensionAttrs}
          className={`w-full py-3.5 rounded-lg bg-white border ${
            error ? "border-red-400" : "border-white/40"
          } ${
            compact ? "text-sm" : "text-base"
          } text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#42BD41] focus:border-transparent ${leftPadding} ${rightPadding} ${AUTOFILL_CLASSES}`}
        />

        {showToggle && (
          <button
            type="button"
            onClick={onToggleVisible}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff size={iconSize} /> : <Eye size={iconSize} />}
          </button>
        )}
      </div>

      {capsLockWarning && capsLockOn && (
        <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-amber-200 bg-amber-500/20 border border-amber-400/40 px-2.5 py-0.5 rounded-full">
          <AlertTriangle size={12} />
          Caps Lock is ON
        </p>
      )}

      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
    </div>
  );
}