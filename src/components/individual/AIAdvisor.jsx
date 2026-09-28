import { useState, useEffect, useRef } from "react";
import { Sparkles, Send } from "lucide-react";
import { getAdvisorPageData, getAIResponse } from "../../mocks/individual/aiAdvisor.mock";

// Layout contract: while this page is active, Dashboard.jsx locks <main> to
// the screen height as a non-scrolling flex column. This component fills it
// with three parts: a static header, a middle area that is the ONLY thing
// that scrolls, and a footer pinned to the bottom.
export default function AIAdvisor() {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getAdvisorPageData().then((data) => {
      if (!cancelled) {
        setPageData(data);
        setMessages([{ id: "welcome", sender: "ai", text: data.welcomeMessage }]);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-scroll: scrolls the messages area itself to the bottom whenever a
  // message is added. Deliberately not scrollIntoView, which also scrolls
  // the overflow-hidden ancestors and can shove the whole page around.
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  // Suggestions exist only before the conversation starts: they disappear
  // once you send anything (typed or picked), and also as soon as you start
  // typing. If you clear the box before sending, they come back.
  const hasStarted = messages.some((m) => m.sender === "user");
  const showSuggestions = !hasStarted && inputValue === "";

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, sender: "user", text: trimmed },
    ]);
    setInputValue("");
    setIsTyping(true);

    const reply = await getAIResponse(trimmed);

    setMessages((prev) => [
      ...prev,
      { id: `ai-${Date.now()}`, sender: "ai", text: reply },
    ]);
    setIsTyping(false);
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

  if (loading) {
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        {header}
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Loading advisor…
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* 1. Static header */}
      {header}

      {/* 2. The only scrolling area */}
      <div
        ref={messagesRef}
        className="flex-1 min-h-0 overflow-y-auto pr-2 mb-4 space-y-4"
      >
        {messages.map((m) =>
          m.sender === "ai" ? (
            <div key={m.id} className="flex items-start gap-3">
              <span className="bg-[#3f6238] p-2.5 rounded-2xl text-white shadow-sm shrink-0">
                <Sparkles size={18} />
              </span>
              <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm max-w-xl text-gray-800 text-sm leading-relaxed whitespace-pre-line">
                {m.text}
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

        {isTyping && (
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
            {pageData.suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                disabled={isTyping}
                className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs px-4 py-2 rounded-full shadow-sm cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="w-full flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your farm finances..."
            disabled={isTyping}
            className="bg-white border border-gray-200 rounded-full px-6 py-3.5 text-sm text-gray-700 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4d6b41] flex-1 disabled:opacity-70"
          />
          <button
            type="submit"
            disabled={isTyping}
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