// Talks to the AI Farm Advisor on the backend (routes/ai.routes.js) and holds
// the chat logic shared by the full AI Advisor page and the floating widget.
//
// Set VITE_AI_MOCK=true to use the old scripted mock data instead (for demos
// without a backend).
import { useCallback, useEffect, useRef, useState } from "react";
import { authedRequest, streamAuthedText } from "../api";
import { getAdvisorPageData, getAIResponse } from "../mocks/individual/aiAdvisor.mock";
import { getAISummary } from "../mocks/individual/aiSummary.mock";

const MOCK = import.meta.env.VITE_AI_MOCK === "true";

export function fetchAdvisor() {
  if (MOCK) return getAdvisorPageData().then((d) => ({ ...d, cropRecommendations: [] }));
  return authedRequest("/api/ai/advisor");
}

export function fetchSummary({ refresh = false, user } = {}) {
  if (MOCK) return getAISummary(user?.firstName, user?.lastName);
  return authedRequest(`/api/ai/summary${refresh ? "?refresh=1" : ""}`);
}

function fetchHistory() {
  if (MOCK) return Promise.resolve({ messages: [] });
  return authedRequest("/api/ai/chat");
}

function deleteHistory() {
  if (MOCK) return Promise.resolve(null);
  return authedRequest("/api/ai/chat", { method: "DELETE" });
}

async function askAdvisor(message, { onChunk, signal }) {
  if (MOCK) {
    const reply = await getAIResponse(message);
    onChunk(reply);
    return reply;
  }
  return streamAuthedText("/api/ai/chat", { body: { message }, onChunk, signal });
}

// Some answers may still contain markdown bold; the chat bubbles show plain text.
export const plainText = (text) => String(text || "").replace(/\*\*|__/g, "");

const toMessage = (m, i) => ({ id: `h-${i}-${m.at || ""}`, sender: m.role === "user" ? "user" : "ai", text: m.text });

/**
 * Everything a chat screen needs: the advisor's opening data (welcome,
 * suggestions, crops for this season), the saved conversation, and send /
 * clear. The answer appears word by word while the AI writes it.
 */
export function useAdvisorChat({ enabled = true } = {}) {
  const [advisor, setAdvisor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isThinking, setIsThinking] = useState(false); // waiting for the first words
  const [isStreaming, setIsStreaming] = useState(false); // words still arriving
  const abortRef = useRef(null);
  const loadedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [data, history] = await Promise.all([fetchAdvisor(), fetchHistory().catch(() => ({ messages: [] }))]);
      setAdvisor(data);
      setMessages([{ id: "welcome", sender: "ai", text: data.welcomeMessage }, ...(history?.messages || []).map(toMessage)]);
    } catch (err) {
      setLoadError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Loads once, the first time `enabled` is true (the widget waits until it's opened).
  useEffect(() => {
    if (!enabled || loadedRef.current) return;
    loadedRef.current = true;
    load();
  }, [enabled, load]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const busy = isThinking || isStreaming;

  const send = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      const replyId = `ai-${Date.now()}`;
      setMessages((prev) => [...prev, { id: `u-${Date.now()}`, sender: "user", text: trimmed }]);
      setIsThinking(true);
      const controller = new AbortController();
      abortRef.current = controller;
      let started = false;
      try {
        await askAdvisor(trimmed, {
          signal: controller.signal,
          onChunk: (piece) => {
            if (!started) {
              started = true;
              setIsThinking(false);
              setIsStreaming(true);
              setMessages((prev) => [...prev, { id: replyId, sender: "ai", text: piece }]);
            } else {
              setMessages((prev) => prev.map((m) => (m.id === replyId ? { ...m, text: m.text + piece } : m)));
            }
          },
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          setMessages((prev) => [
            ...prev.filter((m) => m.id !== replyId),
            { id: `err-${Date.now()}`, sender: "ai", isError: true, text: `Sorry, I couldn't answer that. ${err.message}` },
          ]);
        }
      } finally {
        setIsThinking(false);
        setIsStreaming(false);
      }
    },
    [busy]
  );

  const clear = useCallback(async () => {
    abortRef.current?.abort();
    await deleteHistory().catch(() => {});
    setMessages(advisor ? [{ id: "welcome", sender: "ai", text: advisor.welcomeMessage }] : []);
  }, [advisor]);

  return {
    advisor,
    messages,
    loading,
    loadError,
    reload: load,
    isThinking,
    isStreaming,
    busy,
    send,
    clear,
    hasStarted: messages.some((m) => m.sender === "user"),
  };
}

const peso = (n) => `₱${Math.round(Number(n) || 0).toLocaleString("en-PH")}`;
export { peso };
