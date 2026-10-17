import { useState, useEffect, useCallback, useRef } from "react";
import { authedRequest } from "../api";

// Personal notifications for the signed-in person (payment reminders a
// cooperative sent them, and notes that an admin verified their certificate).
// The server only returns their own.
export const listMyNotifications = ({ page = 1, limit = 20 } = {}) =>
  authedRequest(`/api/notifications?page=${page}&limit=${limit}`);
export const markNotificationRead = (id) => authedRequest(`/api/notifications/${id}/read`, { method: "POST" });
export const markAllNotificationsRead = (kind) =>
  authedRequest(`/api/notifications/read-all${kind ? `?kind=${encodeURIComponent(kind)}` : ""}`, { method: "POST" });

// The kinds of message a farmer sees in the bell and on the Alerts page,
// besides the live alerts: each filter pill maps to one kind. Anything else is
// treated as an announcement from the FarmFund team.
export const MESSAGE_FILTERS = {
  Announcements: "announcement",
  Reminders: "payment_reminder",
  Certificates: "certificate_verified",
};
export const messageKind = (a) =>
  a.kind === "payment_reminder" || a.kind === "certificate_verified" ? a.kind : "announcement";

export const pesoText = (n) => `₱${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Same idea as useAnnouncements: loads the latest, and keeps "unread" in step
// with what the person does. Marking one read changes the screen straight away
// and tells the server; if the server can't be reached the list is reloaded so
// the screen never claims something the server doesn't know.
export function useNotifications({ limit = 20 } = {}) {
  const [state, setState] = useState({ items: [], unreadCount: 0, total: 0, loading: true, error: "" });
  const stateRef = useRef(state);
  stateRef.current = state;
  const latest = useRef(0);

  const load = useCallback(async () => {
    const id = ++latest.current;
    try {
      const r = await listMyNotifications({ page: 1, limit });
      if (id !== latest.current) return;
      setState({ items: r.notifications, unreadCount: r.unreadCount, total: r.total, loading: false, error: "" });
    } catch (err) {
      if (id !== latest.current) return;
      setState((s) => ({ ...s, loading: false, error: (err && err.message) || "Could not load notifications." }));
    }
  }, [limit]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = useCallback(
    async (id) => {
      const item = stateRef.current.items.find((x) => x.id === id);
      if (!item || !item.unread) return;
      latest.current += 1; // an older load must not bring the dot back
      setState((s) => ({
        ...s,
        items: s.items.map((x) => (x.id === id ? { ...x, unread: false } : x)),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }));
      try {
        await markNotificationRead(id);
      } catch {
        load();
      }
    },
    [load]
  );

  // With a kind, only that kind is marked read (e.g. "Mark all as read" on the
  // Reminders filter must not clear certificate notices).
  const markAllRead = useCallback(async (kind) => {
    if (stateRef.current.unreadCount === 0) return;
    latest.current += 1;
    setState((s) => {
      const items = s.items.map((x) => (!kind || x.kind === kind ? { ...x, unread: false } : x));
      const cleared = s.items.filter((x) => x.unread && (!kind || x.kind === kind)).length;
      return { ...s, items, unreadCount: kind ? Math.max(0, s.unreadCount - cleared) : 0 };
    });
    try {
      await markAllNotificationsRead(kind);
    } catch {
      load();
    }
  }, [load]);

  return { ...state, reload: load, markRead, markAllRead };
}