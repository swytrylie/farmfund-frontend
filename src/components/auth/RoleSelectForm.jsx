import { User, Building2 } from "lucide-react";

const ROLES = [
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

export default function RoleSelectForm({ onSelectRole, onSwitchMode }) {
  return (
    <>
      <h2 className="text-3xl font-bold text-white text-center">
        Create your account
      </h2>
      <p className="mt-2 text-center text-sm text-white/70">
        Choose the account type that fits how you'll use the portal.
      </p>

      <div className="grid grid-cols-2 gap-3 my-6">
        {ROLES.map(({ value, icon: Icon, title, caption }) => (
          <button
            key={value}
            onClick={() => onSelectRole(value)}
            className="bg-white rounded-xl p-4 text-center text-black cursor-pointer hover:shadow-lg transition"
          >
            <Icon size={28} className="mx-auto text-gray-900" />
            <p className="mt-2 font-bold text-gray-900">{title}</p>
            <p className="mt-1 text-xs text-gray-500 leading-snug">
              {caption}
            </p>
          </button>
        ))}
      </div>

      <p className="text-center text-white/90">
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