import { Eye, EyeOff } from "lucide-react";

// One reusable input for every form in the auth flow: optional left icon,
// optional password show/hide toggle, and an error message underneath.
//
// Usage:
//   <FormInput icon={Mail} type="email" placeholder="Email"
//              value={data.email} onChange={update("email")} error={errors.email} />
//
//   <FormInput icon={Lock} placeholder="Password" value={data.password}
//              onChange={update("password")} error={errors.password}
//              showToggle visible={showPassword} onToggleVisible={() => setShowPassword(p => !p)} />

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
}) {
  const inputType = showToggle ? (visible ? "text" : "password") : type;
  const iconSize = compact ? 18 : 20;

  const leftPadding = Icon ? (compact ? "pl-11" : "pl-12") : "pl-4";
  const rightPadding = showToggle ? (compact ? "pr-10" : "pr-12") : "pr-4";

  return (
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
        className={`w-full py-3.5 rounded-lg bg-white border ${
          error ? "border-red-400" : "border-white/40"
        } ${
          compact ? "text-sm" : "text-base"
        } text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#42BD41] focus:border-transparent ${leftPadding} ${rightPadding}`}
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

      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
    </div>
  );
}