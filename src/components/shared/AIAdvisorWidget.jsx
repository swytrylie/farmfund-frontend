import { useState, useEffect, useRef } from "react";
import { useAdvisorChat, plainText } from "../../lib/aiAdvisor";
import AIGuideButton from "./AIGuide";
import {
  Lightbulb,
  Bot,
  Maximize2,
  Minimize2,
  X,
  Send,
  RefreshCw,
} from "lucide-react";

// Shown only after an AI answer has finished, so the person always has an
// obvious next step without the initial pills cluttering the conversation.
const FOLLOWUP_PROMPTS = [
  "What should I prioritize this month?",
  "Any risks I should watch for?",
];

const COMPACT_STYLE = { width: 380, height: 520, bottom: 96, right: 24 };
const EXPANDED_STYLE = {
  width: "min(56rem, calc(100vw - 2rem))",
  height: "90vh",
  bottom: "5vh",
  right: "max(1rem, calc(50vw - 28rem))",
};

export default function AIAdvisorWidget() {
  const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  // The advisor's data and conversation load the first time the panel opens.
  const { advisor, messages, loading, loadError, reload, isThinking, isStreaming, busy, send, hasStarted } = useAdvisorChat({
    enabled: isAiAdvisorOpen,
  });
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showFollowups, setShowFollowups] = useState(false);
  const bottomRef = useRef(null);

  // Scrolls to the latest message whenever the conversation changes, and
  // also when the panel opens or resizes.
  useEffect(() => {
    if (isAiAdvisorOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isThinking, isStreaming, isAiAdvisorOpen, isExpanded]);

  // Lets other parts of the app (like the sidebar's AI Advisor item) open
  // this widget by dispatching: window.dispatchEvent(new Event("farmfund:open-ai-advisor"))
  useEffect(() => {
    function handleOpenRequest() {
      setIsAiAdvisorOpen(true);
    }
    window.addEventListener("farmfund:open-ai-advisor", handleOpenRequest);
    return () => window.removeEventListener("farmfund:open-ai-advisor", handleOpenRequest);
  }, []);

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    // Any question, from a pill or the text box, immediately clears the
    // suggestion rows so the panel moves into active conversation mode.
    setShowSuggestions(false);
    setShowFollowups(false);
    setInputValue("");
    await send(trimmed);
    setShowFollowups(true); // follow-ups appear only once the answer is done
  }

  function handleSend(e) {
    e.preventDefault();
    sendMessage(inputValue);
  }

  function handleRefreshSuggestions() {
    setShowFollowups(false);
    setShowSuggestions(true);
  }

  function handleToggleOpen() {
    setIsAiAdvisorOpen((open) => {
      if (open) setIsExpanded(false);
      return !open;
    });
  }

  function handleClose() {
    setIsAiAdvisorOpen(false);
    setIsExpanded(false);
  }

  const textSize = isExpanded ? "text-sm" : "text-xs";

  return (
    <>
      {/* Dimmed backdrop, only while expanded; clicking it collapses back */}
      {isAiAdvisorOpen && isExpanded && (
        <div
          className="fixed inset-0 z-40 bg-black/30 transition-opacity"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Chat panel */}
      {isAiAdvisorOpen && (
        <div
          style={isExpanded ? EXPANDED_STYLE : COMPACT_STYLE}
          className={`fixed z-50 bg-[#f7f8f6] shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? "rounded-3xl" : "rounded-2xl"
          }`}
        >
          {/* Header */}
          <div className="bg-[#2d4027] text-white p-4 flex items-center justify-between rounded-t-2xl shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                <Bot size={18} />
              </span>
              <span className="font-bold text-sm">AI Farm Advisor</span>
            </div>
            <div className="flex items-center gap-3">
              <AIGuideButton tab="chat" tone="dark" />
              <button
                onClick={() => setIsExpanded((v) => !v)}
                className="text-white/70 hover:text-white transition-colors"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={handleClose}
                className="text-white/70 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Message body */}
          <div className="bg-[#f7f8f6] p-4 flex-1 min-h-0 overflow-y-auto space-y-4" aria-live="polite">
            {loading && <p className="text-xs text-gray-400 text-center py-6">Preparing today's advice… this can take a few seconds.</p>}
            {loadError && !loading && (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-gray-600">Couldn't load the advisor. {loadError.message}</p>
                <button
                  onClick={reload}
                  className="text-xs font-semibold text-[#2d4027] underline cursor-pointer"
                >
                  Try again
                </button>
              </div>
            )}
            {messages.map((m) =>
              m.sender === "ai" ? (
                <div key={m.id} className="flex gap-2">
                  <span className="shrink-0 w-7 h-7 rounded-lg bg-[#2d4027] flex items-center justify-center">
                    <Bot size={14} className="text-white" />
                  </span>
                  <div
                    className={`bg-white border rounded-2xl p-4 ${textSize} shadow-sm whitespace-pre-line leading-relaxed ${
                    m.isError ? "border-red-200 text-red-700" : "border-gray-200 text-gray-800"
                  } ${
                      isExpanded ? "max-w-[75%]" : ""
                    }`}
                  >
                    {plainText(m.text)}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex justify-end">
                  <div
                    className={`bg-[#2d4027] text-white rounded-2xl rounded-tr-none px-4 py-3 ${textSize} max-w-[80%]`}
                  >
                    {m.text}
                  </div>
                </div>
              )
            )}

            {isThinking && (
              <div className="flex gap-2">
                <span className="shrink-0 w-7 h-7 rounded-lg bg-[#2d4027] flex items-center justify-center">
                  <Bot size={14} className="text-white" />
                </span>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-xs text-gray-500 shadow-sm flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                  </span>
                  AI Advisor is thinking...
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Initial suggestion pills — gone as soon as a question is sent */}
          {/* A conversation saved from before starts without the opening suggestions. */}
          {showSuggestions && !hasStarted && advisor && (
            <div className="flex flex-wrap gap-2 p-3 bg-[#f7f8f6] shrink-0">
              {advisor.suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="bg-white border border-gray-200 hover:bg-[#f0f5ec] text-[11px] font-medium text-gray-700 px-3 py-1.5 rounded-full cursor-pointer transition"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Follow-ups — only after an answer finishes */}
          {showFollowups && !busy && (
            <div className="p-3 bg-[#f7f8f6] shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Follow up
                </span>
                <button
                  onClick={handleRefreshSuggestions}
                  className="text-[11px] text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw size={11} />
                  Refresh suggestions
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {FOLLOWUP_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="bg-white border border-gray-200 hover:bg-[#f0f5ec] text-[11px] font-medium text-gray-700 px-3 py-1.5 rounded-full cursor-pointer transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input bar */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-[#f7f8f6] border-t border-gray-200 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about your farm finances..."
              maxLength={1000}
              disabled={busy || !advisor}
              className="bg-white border border-gray-200 rounded-full px-5 py-3 text-sm text-gray-700 placeholder-gray-400 flex-1 focus:outline-none focus:ring-2 focus:ring-[#4d6b41] disabled:opacity-70"
            />
            <button
              type="submit"
              disabled={busy || !advisor || !inputValue.trim()}
              className="text-[#2d4027] hover:scale-105 transition-transform cursor-pointer p-1 disabled:opacity-40 disabled:hover:scale-100"
              aria-label="Send"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      )}

      {/* Floating lightbulb toggle button */}
      <button
        onClick={handleToggleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#1c3016] hover:bg-[#26401e] text-white shadow-lg flex items-center justify-center transition-colors"
        aria-label="Toggle AI Farm Advisor"
      >
        <Lightbulb size={24} />
        <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-[#1c3016]" />
      </button>
    </>
  );
}