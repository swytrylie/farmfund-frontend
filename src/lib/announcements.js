import { useState, useEffect, useCallback, useRef } from "react";
import { authedRequest } from "../api";

// Announcements the FarmFund admin sent to the signed-in person. The server
// only ever returns the ones addressed to them.
export const listMyAnnouncements = ({ page = 1, limit = 20 } = {}) =>
  authedRequest(`/api/announcements?page=${page}&limit=${limit}`);
export const markAnnouncementRead = (id) => authedRequest(`/api/announcements/${id}/read`, { method: "POST" });
export const markAllAnnouncementsRead = () => authedRequest("/api/announcements/read-all", { method: "POST" });

export function formatAnnouncementDate(iso) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatAnnouncementDateTime(iso) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

// Loads the person's latest announcements and keeps "unread" in step with
// what they do. Marking one read changes the screen straight away and tells
// the server; if the server can't be reached, the list is reloaded so the
// screen never claims something the server doesn't know.
export function useAnnouncements({ limit = 20 } = {}) {
  const [state, setState] = useState({ items: [], unreadCount: 0, total: 0, loading: true, error: "" });
  const stateRef = useRef(state);
  stateRef.current = state;
  const latest = useRef(0);

  const load = useCallback(async () => {
    const id = ++latest.current;
    try {
      const r = await listMyAnnouncements({ page: 1, limit });
      if (id !== latest.current) return;
      setState({ items: r.announcements, unreadCount: r.unreadCount, total: r.total, loading: false, error: "" });
    } catch (err) {
      if (id !== latest.current) return;
      setState((s) => ({ ...s, loading: false, error: (err && err.message) || "Could not load announcements." }));
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
        await markAnnouncementRead(id);
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
      await markAllAnnouncementsRead();
    } catch {
      load();
    }
  }, [load]);

  return { ...state, reload: load, markRead, markAllRead };
}