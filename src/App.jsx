import { useEffect, useState } from "react";
import FarmFund from "./components/FarmFund";
import Dashboard from "./components/Dashboard";
import {
  apiRequest,
  refreshSession,
  setAccessToken,
  setSessionExpiredHandler,
} from "./api";
import "./index.css";

function App() {
  // { accessToken, user } while logged in, null otherwise. Memory only:
  // never put the access token in localStorage.
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  // If a refresh ever fails mid-session, drop back to the login screen.
  useEffect(() => {
    setSessionExpiredHandler(() => setSession(null));
  }, []);

  // On page load, try to restore the session from the refresh cookie.
  useEffect(() => {
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

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  if (session) {
    return <Dashboard user={session.user} onSignOut={handleSignOut} />;
  }

  // LoginForm passes { accessToken, user } here after a successful login
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