const API_URL = import.meta.env.VITE_API_URL;

// Called with the end time (or null) when the server answers "down for
// maintenance". App.jsx sets this to show the maintenance screen.
let onMaintenance = () => {};

export function setMaintenanceHandler(fn) {
  onMaintenance = fn;
}

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  // A file upload is sent as-is (the browser adds its own multipart header);
  // everything else is sent as JSON.
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    // fetch itself failed: server down, wrong URL, or blocked by CORS
    throw new Error('Cannot reach the server. Is the backend running?');
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    // The server is in maintenance mode: tell the app, so it can show the
    // "Down for maintenance" screen. The request itself still fails below.
    if (res.status === 503 && json?.code === 'MAINTENANCE') {
      try {
        onMaintenance(json.maintenance?.until || null);
      } catch {
        // a broken handler must never hide the real error
      }
    }
    // If the server explained exactly what was wrong (e.g. "name cannot contain < or >"),
    // show that instead of the generic "Validation failed".
    const specific =
      Array.isArray(json?.details) && typeof json.details[0]?.message === 'string'
        ? json.details[0].message
        : null;
    const error = new Error(specific || json?.message || `Request failed (${res.status})`);
    error.status = res.status;
    error.details = json?.details;
    throw error;
  }

  // Your backend wraps everything as { success, message, data }, so return just `data`
  return json?.data;
}

// Refresh tokens rotate: using the same cookie twice at once makes the
// backend think it was stolen and revokes the session. React's dev mode
// runs effects twice, so we share one in-flight request between callers.
let refreshInFlight = null;

export function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = apiRequest('/api/auth/refresh', { method: 'POST' }).finally(
      () => {
        refreshInFlight = null;
      }
    );
  }
  return refreshInFlight;
}

// The current access token lives here (memory only) so any file can make
// authenticated calls without passing the token around.
let accessToken = null;
let onSessionExpired = () => {};

export function setAccessToken(token) {
  accessToken = token;
}

export function setSessionExpiredHandler(fn) {
  onSessionExpired = fn;
}

// Use this for every protected route (crops, farms, /me, ...).
// If the token expired, it refreshes once and retries the request.
export async function authedRequest(path, options = {}) {
  try {
    return await apiRequest(path, { ...options, token: accessToken });
  } catch (err) {
    if (err.status !== 401) throw err;

    try {
      const fresh = await refreshSession();
      accessToken = fresh.accessToken;
    } catch {
      accessToken = null;
      onSessionExpired();
      throw err;
    }
    return apiRequest(path, { ...options, token: accessToken });
  }
}

// Like authedRequest, but for answers the server sends as a stream of plain
// text (the AI Farm Advisor chat). onChunk(text) is called as each piece
// arrives; the promise resolves with the whole answer.
export async function streamAuthedText(path, { body, onChunk, signal } = {}) {
  const send = () =>
    fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(body),
      signal,
    });

  let res;
  try {
    res = await send();
    if (res.status === 401) {
      const fresh = await refreshSession().catch(() => {
        accessToken = null;
        onSessionExpired();
        throw new Error('Your session expired. Please sign in again.');
      });
      accessToken = fresh.accessToken;
      res = await send();
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error(err.message?.startsWith('Your session') ? err.message : 'Cannot reach the server. Is the backend running?');
  }

  if (!res.ok || !res.body) {
    const json = await res.json().catch(() => null);
    if (res.status === 503 && json?.code === 'MAINTENANCE') {
      try {
        onMaintenance(json.maintenance?.until || null);
      } catch {
        // a broken handler must never hide the real error
      }
    }
    const specific = Array.isArray(json?.details) && typeof json.details[0]?.message === 'string' ? json.details[0].message : null;
    const error = new Error(specific || json?.message || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const piece = decoder.decode(value, { stream: true });
    full += piece;
    onChunk?.(piece);
  }
  return full;
}