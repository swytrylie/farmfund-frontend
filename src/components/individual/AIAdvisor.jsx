import { useState, useEffect, useRef } from "react";
import { Sparkles, Send, Sprout, ChevronDown, CloudRain, RotateCcw } from "lucide-react";
import { useAdvisorChat, plainText, peso } from "../../lib/aiAdvisor";

const shortDate = (iso) =>
  new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

// Crops that fit this season for the farmer's municipality, from the backend's
// Pangasinan crop calendar. "Ask about this" sends the question to the chat.
function SeasonPanel({ advisor, open, onToggle, onAsk, disabled }) {
  const crops = advisor.cropRecommendations || [];
  if (!crops.length) return null;
  const where = advisor.location?.municipality ? ` in ${advisor.location.municipality}` : "";
  return (
    <div className="flex-shrink-0 mb-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left cursor-pointer"
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <span className="bg-[#eef4e8] text-[#3f6238] p-2 rounded-xl shrink-0">
            <Sprout size={16} />
          </span>
          <span className="min-w-0">
            <span className="block font-bold text-gray-900 text-sm">What to plant now{where}</span>
            <span className="block text-xs text-gray-500 truncate">
              {advisor.season?.label}
              {advisor.weather ? `. Next 7 days: ${advisor.weather.rainNext7DaysMm} mm of rain` : ""}
            </span>
          </span>
        </span>
        <ChevronDown size={18} className={`text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-5 pb-4">
          {advisor.weather?.risks?.some((r) => r.includes("rain")) && (
            <p className="mb-3 flex items-start gap-2 text-xs text-amber-900 bg-[#fffbeb] border border-amber-200 rounded-xl px-3 py-2">
              <CloudRain size={14} className="mt-0.5 shrink-0" />
              Heavy rain is forecast (up to {advisor.weather.maxRain3DaysMm} mm in 3 days). Wait for it to pass before planting vegetables.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 max-h-56 overflow-y-auto pr-1">
            {crops.map((c, i) => (
              <div key={c.id} className={`flex flex-col rounded-xl border p-3.5 ${i === 0 ? "border-[#4f7331] bg-[#f6f9f3]" : "border-gray-100"}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-gray-900 text-sm leading-tight">
                    {c.name} <span className="font-normal text-gray-500">({c.localName})</span>
                  </p>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      c.plantNow ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {c.plantNow ? "Plant now" : "Next month"}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-gray-600">
                  Est. profit <span className="font-bold text-gray-900">{peso(c.estimated.profit)}</span> on {c.suggestedAreaHa} ha,
                  harvest around {shortDate(c.expectedHarvestDate)}
                </p>
                <p className="mt-1.5 text-xs text-gray-500 leading-relaxed line-clamp-2" title={c.why}>
                  {c.why}
                </p>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onAsk(`Tell me more about planting ${c.name.toLowerCase()} (${c.localName}) this season.`)}
                  className="mt-auto pt-2 self-start text-xs font-semibold text-[#3f6238] hover:text-[#2d4027] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ask about this
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] text-gray-400">
            Estimates for planning only. Weather data by Open-Meteo.com.
          </p>
        </div>
      )}
    </div>
  );
}

// Layout contract: while this page is active, Dashboard.jsx locks <main> to
// the screen height as a non-scrolling flex column. This component fills it
// with three parts: a static header, a middle area that is the ONLY thing
// that scrolls, and a footer pinned to the bottom.
export default function AIAdvisor() {
  const { advisor, messages, loading, loadError, reload, isThinking, isStreaming, busy, send, clear, hasStarted } = useAdvisorChat();
  const [inputValue, setInputValue] = useState("");
  // null = automatic: open until a conversation starts, then folded away to give the chat room.
  const [seasonChoice, setSeasonChoice] = useState(null);
  const seasonOpen = seasonChoice ?? !hasStarted;
  const messagesRef = useRef(null);

  // Auto-scroll: scrolls the messages area itself to the bottom whenever a
  // message is added or grows. Deliberately not scrollIntoView, which also
  // scrolls the overflow-hidden ancestors and can shove the whole page around.
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: isStreaming ? "auto" : "smooth" });
  }, [messages, isThinking, isStreaming]);

  // Suggestions exist only before the conversation starts: they disappear
  // once you send anything (typed or picked), and also as soon as you start
  // typing. If you clear the box before sending, they come back.
  const showSuggestions = !hasStarted && inputValue === "";

  function sendMessage(text) {
    if (!text.trim() || busy) return;
    setInputValue("");
    send(text);
  }

  function handleSend(e) {
    e.preventDefault();
    sendMessage(inputValue);
  }

  // pr-16 keeps the title clear of the notification bell in the top-right.
  const header = (
    <div className="flex-shrink-0 mb-4 pr-16">
      <h2 className="text-3xl font-bold text-gray-900">AI Farm Advisor</h2>
      <p className="mt-1 text-gray-500">
        Tailored recommendations generated from your farm records and AI
        summary.
      </p>
    </div>
  );

  if (loading || loadError) {
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        {header}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400 text-sm">
          {loading ? (
            "Loading advisor…"
          ) : (
            <>
              <p className="text-gray-600">Couldn't load the advisor. {loadError.message}</p>
              <button
                type="button"
                onClick={reload}
                className="bg-[#3f6238] hover:bg-[#2d4027] text-white text-sm font-semibold px-4 py-2 rounded-full cursor-pointer"
              >
                Try again
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* 1. Static header */}
      {header}
      <SeasonPanel
        advisor={advisor}
        open={seasonOpen}
        onToggle={() => setSeasonChoice(!seasonOpen)}
        onAsk={sendMessage}
        disabled={busy}
      />

      {/* 2. The only scrolling area */}
      <div
        ref={messagesRef}
        className="flex-1 min-h-0 overflow-y-auto pr-2 mb-4 space-y-4"
        aria-live="polite"
      >
        {messages.map((m) =>
          m.sender === "ai" ? (
            <div key={m.id} className="flex items-start gap-3">
              <span className="bg-[#3f6238] p-2.5 rounded-2xl text-white shadow-sm shrink-0">
                <Sparkles size={18} />
              </span>
              <div
                className={`bg-white border rounded-3xl p-5 shadow-sm max-w-xl text-sm leading-relaxed whitespace-pre-line ${
                  m.isError ? "border-red-200 text-red-700" : "border-gray-100 text-gray-800"
                }`}
              >
                {plainText(m.text)}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex justify-end">
              <div className="bg-[#4f7331] text-white px-5 py-3 rounded-2xl max-w-xs ml-auto text-sm font-medium shadow-sm">
                {m.text}
              </div>
            </div>
          )
        )}

        {isThinking && (
          <div className="flex items-start gap-3">
            <span className="bg-[#3f6238] p-2.5 rounded-2xl text-white shadow-sm shrink-0">
              <Sparkles size={18} />
            </span>
            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm text-gray-400 text-sm">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Footer: pinned to the bottom, never moves as messages change */}
      <div className="flex-shrink-0 sticky bottom-0 bg-white/80 backdrop-blur-md pt-3 pb-2 border-t border-gray-100 z-10">
        {showSuggestions && (
          <div className="flex flex-wrap gap-2 mb-3 max-h-24 overflow-y-auto">
            {advisor.suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                disabled={busy}
                className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs px-4 py-2 rounded-full shadow-sm cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="w-full flex items-center gap-2">
          {hasStarted && (
            <button
              type="button"
              onClick={clear}
              disabled={busy}
              className="text-gray-400 hover:text-gray-600 cursor-pointer p-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Start a new conversation"
              title="Start a new conversation"
            >
              <RotateCcw size={18} />
            </button>
          )}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your farm finances or what to plant..."
            maxLength={1000}
            disabled={busy}
            className="bg-white border border-gray-200 rounded-full px-6 py-3.5 text-sm text-gray-700 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4d6b41] flex-1 disabled:opacity-70"
          />
          <button
            type="submit"
            disabled={busy || !inputValue.trim()}
            className="text-[#3f6238] hover:text-[#2d4027] cursor-pointer text-xl flex items-center justify-center p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
