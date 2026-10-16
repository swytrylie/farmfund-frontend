import { useState, useEffect, useRef, useCallback } from "react";
import { authedRequest } from "../api";

// Calls and small helpers shared by the two admin pages that manage people
// (User Management and Account Status). All of them hit /api/admin/users,
// which the server only allows for admin accounts.

export function listAdminUsers({ search = "", type = "all", status = "all", page = 1, limit = 20 } = {}) {
  const q = new URLSearchParams();
  if (search) q.set("search", search);
  if (type && type !== "all") q.set("type", type);
  if (status && status !== "all") q.set("status", status);
  q.set("page", String(page));
  q.set("limit", String(limit));
  return authedRequest(`/api/admin/users?${q.toString()}`);
}

export const suspendAdminUser = (id, reason) =>
  authedRequest(`/api/admin/users/${id}/suspend`, { method: "PATCH", body: { reason } });

export const reactivateAdminUser = (id) =>
  authedRequest(`/api/admin/users/${id}/reactivate`, { method: "PATCH" });

export const updateAdminUser = (id, changes) =>
  authedRequest(`/api/admin/users/${id}`, { method: "PATCH", body: changes });

export const deleteAdminUser = (id) =>
  authedRequest(`/api/admin/users/${id}`, { method: "DELETE" });

export const sendAdminPasswordReset = (id) =>
  authedRequest(`/api/admin/users/${id}/password-reset`, { method: "POST" });

export function messageFrom(err, fallback) {
  return err && err.message ? err.message : fallback;
}

export function formatDate(iso) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(iso) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

// Loads one page of people, with search (waits 300 ms after typing stops),
// a page number, and "ignore answers that arrive late" so a slow old request
// can never overwrite a newer one.
export function useAdminUserList({ type = "all", status = "all", limit = 20, enabled = true, onUnauthorized } = {}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ users: [], total: 0, pages: 1, counts: { active: 0, suspended: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const latest = useRef(0);
  const appliedSearch = useRef("");

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = search.trim();
      // Only a real change of the search text sends the list back to page 1.
      if (next === appliedSearch.current) return;
      appliedSearch.current = next;
      setDebouncedSearch(next);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // A different filter always starts again from page 1. Done while rendering
  // (not in an effect) so no request is ever sent for "new filter, old page".
  const filterKey = `${type}|${status}`;
  const [seenFilterKey, setSeenFilterKey] = useState(filterKey);
  if (seenFilterKey !== filterKey) {
    setSeenFilterKey(filterKey);
    setPage(1);
  }

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      const id = ++latest.current;
      // Switched off (the page is showing something else): send nothing, and
      // ignore any answer still on its way.
      if (!enabled) {
        setLoading(false);
        return;
      }
      if (!quiet) setLoading(true);
      setError("");
      try {
        const result = await listAdminUsers({ search: debouncedSearch, type, status, page, limit });
        if (id !== latest.current) return;
        setData(result);
      } catch (err) {
        if (id !== latest.current) return;
        if (err && err.status === 401) {
          onUnauthorized?.();
          return;
        }
        setError(messageFrom(err, "Could not load the accounts."));
      } finally {
        if (id === latest.current) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debouncedSearch, type, status, page, limit, enabled]
  );

  useEffect(() => {
    load();
  }, [load]);

  return { ...data, page, setPage, search, setSearch, loading, error, reload: load, limit };
}