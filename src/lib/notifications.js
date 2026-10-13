import { useState, useEffect, useCallback, useRef } from "react";
import { authedRequest } from "../api";

// Personal notifications for the signed-in person (right now: payment
// reminders a cooperative sent them). The server only returns their own.
export const listMyNotifications = ({ page = 1, limit = 20 } = {}) =>
  authedRequest(`/api/notifications?page=${page}&limit=${limit}`);
export const markNotificationRead = (id) => authedRequest(`/api/notifications/${id}/read`, { method: "POST" });
export const markAllNotificationsRead = () => authedRequest("/api/notifications/read-all", { method: "POST" });

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

  const markAllRead = useCallback(async () => {
    if (stateRef.current.unreadCount === 0) return;
    latest.current += 1;
    setState((s) => ({ ...s, items: s.items.map((x) => ({ ...x, unread: false })), unreadCount: 0 }));
    try {
      await markAllNotificationsRead();
    } catch {
      load();
    }
  }, [load]);

  return { ...state, reload: load, markRead, markAllRead };
}