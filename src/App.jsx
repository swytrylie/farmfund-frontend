import { useEffect, useState } from "react";
import FarmFund from "./components/shared/FarmFund";
import Dashboard from "./components/individual/Dashboard";
import OrgDashboard from "./components/organization/OrgDashboard";
import AdminLogin from "./components/admin/AdminLogin";
import AdminDashboard from "./components/admin/AdminDashboard";
import CompleteAccount from "./components/organization/CompleteAccount";
import SecureAccount from "./components/organization/SecureAccount";
import {
  apiRequest,
  refreshSession,
  setAccessToken,
  setSessionExpiredHandler,
} from "./api";
import "./index.css";

// Simple path check for the admin entry point — no full router needed for
// just one distinct URL. Visiting /admin shows the admin login/dashboard
// instead of the normal farmer/org flow entirely.
const isAdminPath = window.location.pathname === "/admin";

// Same simple pattern as isAdminPath — a public page with no session
// requirement at all, since whoever lands here doesn't have an account
// yet. Checked ahead of any session-restoration logic below.
const isAcceptInvitePath = window.location.pathname === "/accept-invite";

// Same pattern again — the page opened from the "Your email address was
// changed" notice. Public: whoever opens it may not be able to log in.
const isSecureAccountPath = window.location.pathname === "/secure-account";

function App() {
  // { accessToken, user } while logged in, null otherwise. Memory only:
  // never put the access token in localStorage.
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  // Admin uses its own separate session state, kept independent of the
  // regular `session` state above. This is a REAL backend session now (an
  // admin account is just a User document with role: "admin", authenticated
  // through the same /api/auth/login endpoint everyone else uses) — it's
  // just not restored from the refresh cookie on page load like the regular
  // flow is, since the admin and farmer/org flows are separate URLs that
  // are never active in the same tab at once.
  const [adminSession, setAdminSession] = useState(null);

  // If a refresh ever fails mid-session, drop back to the login screen.
  useEffect(() => {
    setSessionExpiredHandler(() => setSession(null));
  }, []);

  // On page load, try to restore the session from the refresh cookie.
  // Skipped entirely on the admin path, since admin doesn't use this real
  // backend session flow at all — and skipped on the accept-invite path
  // too, since nobody there has an account to restore a session for yet.
  useEffect(() => {
    if (isAdminPath || isAcceptInvitePath || isSecureAccountPath) return;
    let cancelled = false;

    async function restoreSession() {
      try {
        const { accessToken } = await refreshSession();
        setAccessToken(accessToken);
        const user = await apiRequest("/api/auth/me", { token: accessToken });
        if (!cancelled) setSession({ accessToken, user });
      } catch {
        // No valid cookie: just show the landing/login page.
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignOut() {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch {
      // Even if the request fails, still sign out locally.
    }
    setAccessToken(null);
    setSession(null);
  }

  // Same real revocation as the regular sign-out above — a real session
  // needs to actually be revoked server-side (clearing refreshTokenHash),
  // not just forgotten in the browser.
  async function handleAdminSignOut() {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch {
      // Even if the request fails, still sign out locally.
    }
    setAccessToken(null);
    setAdminSession(null);
  }

  // "Secure my account" page from the email-changed notice — public too.
  if (isSecureAccountPath) {
    return <SecureAccount />;
  }

  // Accept-invite flow — checked first, before anything session-related,
  // since this page genuinely has no session to check yet.
  if (isAcceptInvitePath) {
    return (
      <CompleteAccount
        onComplete={() => {
          // Account created successfully — send them to the normal login
          // screen to sign in with their new password, same as how the
          // organization sign-up flow hands off afterward.
          window.location.href = "/";
        }}
      />
    );
  }

  // Admin flow — checked first, completely separate from everything below.
  if (isAdminPath) {
    if (adminSession) {
      return (
        <AdminDashboard
          user={adminSession.user}
          onSignOut={handleAdminSignOut}
        />
      );
    }
    return (
      <AdminLogin
        onLoginSuccess={(data) => {
          setAccessToken(data.accessToken);
          setAdminSession(data);
        }}
      />
    );
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  if (session) {
    // Organization accounts get the Coop/Lender dashboard instead of the
    // individual farmer one. accountType is set by the backend itself
    // (checked via real CooperativeMember records on both login and
    // session restore), not something the frontend decides on its own.
    if (session.user?.accountType === "organization") {
      return <OrgDashboard user={session.user} onSignOut={handleSignOut} />;
    }
    return <Dashboard user={session.user} onSignOut={handleSignOut} />;
  }

  // LoginForm passes { accessToken, user } here after a successful login.
  // Organization signup also lands here, through the same real backend
  // flow (register() + an immediate login()), not a separate mocked path.
  return (
    <FarmFund
      onLoginSuccess={(data) => {
        setAccessToken(data.accessToken);
        setSession(data);
      }}
    />
  );
}

export default App;