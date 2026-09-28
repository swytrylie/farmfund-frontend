import { useState, useEffect } from "react";
import { Lock, X, RefreshCw } from "lucide-react";
import FormInput from "./FormInput";
import { getPasswordStrength, generateStrongPassword } from "../../lib/passwordStrength";

const LEVEL_STYLES = {
  1: { bar: "bg-red-500", text: "text-red-300" },
  2: { bar: "bg-amber-500", text: "text-amber-300" },
  3: { bar: "bg-emerald-400", text: "text-emerald-300" },
};

// Small dark tooltip under the field: a one-line strength meter, and the
// suggested password underneath. Hover the strength line for tips on how to
// improve the password.
function PasswordStrengthPopover({ password, suggestion, compact, onRefresh, onUse, onDismiss }) {
  // Fade + drop in on mount
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const strength = getPasswordStrength(password);
  const styles = LEVEL_STYLES[strength.level];

  return (
    <div
      // Keeps the input focused when clicking inside the card, so clicks on
      // its buttons always register (Safari doesn't focus buttons on click).
      onMouseDown={(e) => e.preventDefault()}
      className={`mt-2 rounded-xl bg-[#2d4027] border border-[#4d6b41]/40 shadow-lg px-3 py-2.5 text-xs text-white transition-all duration-200 ease-out ${
        entered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
      }`}
    >
      {/* Strength meter, one line */}
      <div className="flex items-center gap-2" title={strength.hint || undefined}>
        <span className="text-white/70">Strength:</span>
        {strength.level === 0 ? (
          <span className="text-white/50">not entered yet</span>
        ) : (
          <span className={`font-bold ${styles.text}`}>{strength.label}</span>
        )}
        <div className="flex gap-1 w-16">
          {[1, 2, 3].map((segment) => (
            <div
              key={segment}
              className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                strength.level >= segment ? styles.bar : "bg-white/15"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="ml-auto text-white/50 hover:text-white transition-colors shrink-0"
          aria-label="Close password tips"
        >
          <X size={14} />
        </button>
      </div>

      {/* Suggested strong password */}
      <button
        type="button"
        onClick={onUse}
        className="mt-2 flex items-center gap-1.5 font-semibold text-emerald-300 cursor-pointer hover:underline"
      >
        <Lock size={12} />
        Use suggested strong password
      </button>

      <div
        className={`mt-1.5 flex items-center justify-between gap-2 font-mono bg-[#1f2d1b] px-2.5 py-1 rounded-lg border border-white/10 text-emerald-200 ${
          compact ? "text-[11px]" : "text-sm tracking-wide"
        }`}
      >
        <button
          type="button"
          onClick={onUse}
          className="min-w-0 truncate text-left cursor-pointer hover:text-emerald-100 transition-colors"
          title="Click to use this password"
        >
          {suggestion}
        </button>
        <button
          type="button"
          onClick={onRefresh}
          className="shrink-0 text-emerald-300 hover:text-emerald-100 transition-colors"
          aria-label="Suggest a different password"
          title="Suggest a different password"
        >
          <RefreshCw size={12} />
        </button>
      </div>
    </div>
  );
}

// A FormInput for creating a password, plus the strength/suggestion card.
// The card opens when the field is focused, and closes when you dismiss it,
// use the suggestion, or move focus out of the field and card.
//
// onUseSuggested(password) is called with the generated password; the parent
// decides what to fill (so it can set the confirm field too).
export default function PasswordStrengthField({
  icon,
  placeholder,
  value,
  onChange,
  error,
  visible,
  onToggleVisible,
  compact = false,
  onUseSuggested,
}) {
  const [open, setOpen] = useState(false);
  const [suggestion, setSuggestion] = useState(() => generateStrongPassword());

  function handleUse() {
    onUseSuggested(suggestion);
    setOpen(false);
    setSuggestion(generateStrongPassword()); // fresh one for next time
  }

  return (
    <div
      onBlur={(e) => {
        // Only close when focus leaves the whole field + card
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <FormInput
        icon={icon}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        error={error}
        showToggle
        visible={visible}
        onToggleVisible={onToggleVisible}
        compact={compact}
        onFocus={() => setOpen(true)}
        autoComplete="new-password"
        capsLockWarning
      />

      {open && (
        <PasswordStrengthPopover
          password={value}
          suggestion={suggestion}
          compact={compact}
          onRefresh={() => setSuggestion(generateStrongPassword())}
          onUse={handleUse}
          onDismiss={() => setOpen(false)}
        />
      )}
    </div>
  );
}