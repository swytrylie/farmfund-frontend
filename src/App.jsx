import { useEffect, useState } from "react";
import FarmFund from "./components/shared/FarmFund";
import Dashboard from "./components/individual/Dashboard";
import OrgDashboard from "./components/organization/OrgDashboard";
import AdminLogin from "./components/admin/AdminLogin";
import AdminDashboard from "./components/admin/AdminDashboard";
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

function App() {
  // { accessToken, user } while logged in, null otherwise. Memory only:
  // never put the access token in localStorage.
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  // Admin uses its own separate session state — mocked, no real backend
  // session/cookie exists for it yet, so it's kept completely independent
  // of the real session-restoration logic below (which calls real backend
  // endpoints that don't apply to a mocked admin login).
  const [adminSession, setAdminSession] = useState(null);

  // If a refresh ever fails mid-session, drop back to the login screen.
  useEffect(() => {
    setSessionExpiredHandler(() => setSession(null));
  }, []);

  // On page load, try to restore the session from the refresh cookie.
  // Skipped entirely on the admin path, since admin doesn't use this real
  // backend session flow at all.
  useEffect(() => {
    if (isAdminPath) return;
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

  // Admin flow — checked first, completely separate from everything below.
  if (isAdminPath) {
    if (adminSession) {
      return (
        <AdminDashboard
          user={adminSession.user}
          onSignOut={() => setAdminSession(null)}
        />
      );
    }
    return <AdminLogin onLoginSuccess={(data) => setAdminSession(data)} />;
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  if (session) {
    // Organization accounts (currently a mocked, design-only signup flow —
    // no real backend endpoint for orgs exists yet) get the Coop/Lender
    // dashboard instead of the individual farmer one.
    if (session.user?.accountType === "organization") {
      return <OrgDashboard user={session.user} onSignOut={handleSignOut} />;
    }
    return <Dashboard user={session.user} onSignOut={handleSignOut} />;
  }

  // LoginForm passes { accessToken, user } here after a successful login.
  // Organization signup now also lands here (via FarmFund intercepting
  // "org-signup-success"), with accessToken: null since there's no real
  // backend session for it yet.
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