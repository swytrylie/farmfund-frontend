import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, TrendingUp, CreditCard, Lightbulb } from "lucide-react";
import { checkAdminCredentials } from "../../mocks/admin/adminAuth.mock";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const features = [
  { icon: TrendingUp, label: "Real-time income & expense tracking" },
  { icon: CreditCard, label: "Loan and repayment management" },
  { icon: Lightbulb, label: "AI Farm Advisor recommendations" },
];

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    const newErrors = {
      email: !email.trim()
        ? "Email is required."
        : !EMAIL_REGEX.test(email)
        ? "Enter a valid email address."
        : null,
      password: !password
        ? "Password is required."
        : password.length < 8
        ? "Password must be at least 8 characters."
        : null,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setLoading(true);
    const adminUser = await checkAdminCredentials(email, password);
    setLoading(false);

    if (!adminUser) {
      setErrors({ password: "Invalid administrator credentials." });
      return;
    }

    onLoginSuccess({
      accessToken: null, // mocked — no real backend admin session yet
      user: adminUser,
    });
  }

  return (
    <section
      className="relative w-full min-h-screen flex items-center bg-cover bg-center overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(6,20,10,0.92) 0%, rgba(6,20,10,0.82) 30%, rgba(6,20,10,0.45) 60%, rgba(6,20,10,0.15) 100%), url('/images/farmland-aerial.jpg')",
      }}
    >
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-24 md:py-16 grid grid-cols-1 lg:grid-cols-12">
        {/* Left: same hero copy as the standard farmer/org login */}
        <div className="lg:col-span-7">
          <div className="max-w-xl">
            <h1 className="font-extrabold leading-[1.05] tracking-tight text-4xl sm:text-5xl lg:text-6xl">
              <span className="block text-white">Your Farm.</span>
              <span className="block text-white">
                Your <span className="text-[#42BD41]">Finances.</span>
              </span>
              <span className="block text-white">Under Control.</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-white/75 leading-relaxed max-w-md">
              Track income, manage expenses, monitor loans, and get
              AI-powered insights — all designed for farmers.
            </p>

            <ul className="mt-9 space-y-5">
              {features.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-4">
                  <span className="flex-shrink-0 w-11 h-11 rounded-full border-2 border-[#42BD41] flex items-center justify-center">
                    <Icon size={20} strokeWidth={2.25} className="text-[#42BD41]" />
                  </span>
                  <span className="text-white font-medium text-base sm:text-lg leading-snug">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: floating frosted-glass admin login card */}
        <div className="lg:col-span-5 flex items-center justify-center">
          <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl p-8 shadow-2xl max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              Welcome Back!
            </h2>
            <span className="block text-xs font-semibold uppercase tracking-wider text-green-100 bg-emerald-900/40 px-3 py-1 rounded-full w-fit mx-auto mb-6">
              Admin
            </span>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="Email"
                    className="bg-white/90 border border-white/40 rounded-xl pl-10 pr-4 py-3 text-gray-800 placeholder-gray-400 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-300 font-medium">{errors.email}</p>
                )}
              </div>

              <div>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder="Password"
                    className="bg-white/90 border border-white/40 rounded-xl pl-10 pr-10 py-3 text-gray-800 placeholder-gray-400 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-300 font-medium">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#42BD41] hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all shadow-md mb-4 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {loading ? "Signing in…" : "Log In"}
              </button>
            </form>

            <p className="text-[11px] text-white/60 text-center">
              For this demo: admin@gmail.com / Admin1234!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}