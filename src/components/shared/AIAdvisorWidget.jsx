import { useState, useEffect, useRef } from "react";
import {
  Lightbulb,
  Bot,
  Maximize2,
  Minimize2,
  X,
  Send,
  RefreshCw,
} from "lucide-react";

const AI_WELCOME_MESSAGE = `Magandang araw, Manuel! I'm your AI Farm Advisor.

Based on your records this month:
• Total Income: ₱58,200
• Total Expenses: ₱12,590
• Net Surplus: ₱45,610

Your farm is in a healthy position this month. You have two active loans totaling ₱151,500 remaining. Would you like budgeting tips for the upcoming wet season planting?`;

const SUGGESTED_PROMPTS = [
  "How can I reduce my farm expenses?",
  "Analyze my finances",
  "Advise me on my current loans",
  "How is my farm's profit margin?",
  "What's in my income trend?",
];

// Shown only after an AI answer has finished, so the person always has an
// obvious next step without the initial pills cluttering the conversation.
const FOLLOWUP_PROMPTS = [
  "What should I prioritize this month?",
  "Any risks I should watch for?",
];

const FARM = {
  income: 58200,
  expenses: 12590,
  surplus: 45610,
  activeLoans: 151500,
};

const peso = (n) => `₱${n.toLocaleString()}`;

// Scripted, keyword-matched replies built from the farm's real figures.
// This is NOT a live AI call — swap getScriptedReply for a real API request
// once the backend advisor exists.
function getScriptedReply(question) {
  const q = question.toLowerCase();
  const expenseRatio = ((FARM.expenses / FARM.income) * 100).toFixed(1);
  const margin = ((FARM.surplus / FARM.income) * 100).toFixed(1);

  if (q.includes("expense") || q.includes("reduce")) {
    return `Your expenses are ${peso(FARM.expenses)} against ${peso(
      FARM.income
    )} in income, about ${expenseRatio}% of what you earn. Start with your largest recurring costs (inputs and labor). Even small percentage cuts there add up to the biggest peso savings.`;
  }
  if (q.includes("loan")) {
    return `You have ${peso(
      FARM.activeLoans
    )} remaining across two active loans. With a monthly surplus of ${peso(
      FARM.surplus
    )}, you could put part of it toward extra principal payments, if your lenders allow it without penalty. That can shorten your payoff time and cut interest.`;
  }
  if (q.includes("profit") || q.includes("margin")) {
    return `Your profit margin this month is about ${margin}% (${peso(
      FARM.surplus
    )} surplus on ${peso(
      FARM.income
    )} income). That's strong. To push it higher, either raise income (better pricing, added revenue) or trim expenses.`;
  }
  if (q.includes("income") || q.includes("trend")) {
    return `Income this month was ${peso(
      FARM.income
    )}, comfortably covering ${peso(
      FARM.expenses
    )} in expenses. I only have this month loaded, so I can't show a multi-month trend yet, but the current picture is healthy.`;
  }
  if (q.includes("analy") || q.includes("finance")) {
    return `Snapshot: Income ${peso(FARM.income)}, Expenses ${peso(
      FARM.expenses
    )}, Surplus ${peso(FARM.surplus)}, Active Loans ${peso(
      FARM.activeLoans
    )}. Your surplus is healthy. Directing some of it at your loan balance is the most effective next step.`;
  }
  if (q.includes("prioritize")) {
    return `This month I'd prioritize two things: set aside part of your ${peso(
      FARM.surplus
    )} surplus for wet-season planting inputs, and make sure your next loan payment is fully covered before spending elsewhere.`;
  }
  if (q.includes("risk")) {
    return `The main thing to watch is your ${peso(
      FARM.activeLoans
    )} loan balance. Your surplus covers it comfortably today, but a bad harvest or price drop would shrink that cushion quickly. Keeping a reserve is the safest hedge.`;
  }
  return `Based on your numbers (Income ${peso(FARM.income)}, Expenses ${peso(
    FARM.expenses
  )}, Surplus ${peso(FARM.surplus)}, Active Loans ${peso(
    FARM.activeLoans
  )}), things look healthy. Ask me about expenses, loans, or profit margin and I'll go deeper.`;
}

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
  const [messages, setMessages] = useState([
    { id: "welcome", sender: "ai", text: AI_WELCOME_MESSAGE },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showFollowups, setShowFollowups] = useState(false);
  const bottomRef = useRef(null);
  const replyTimer = useRef(null);

  // Scrolls to the latest message whenever the conversation changes, and
  // also when the panel opens or resizes.
  useEffect(() => {
    if (isAiAdvisorOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isThinking, isAiAdvisorOpen, isExpanded]);

  // Lets other parts of the app (like the sidebar's AI Advisor item) open
  // this widget by dispatching: window.dispatchEvent(new Event("farmfund:open-ai-advisor"))
  useEffect(() => {
    function handleOpenRequest() {
      setIsAiAdvisorOpen(true);
    }
    window.addEventListener("farmfund:open-ai-advisor", handleOpenRequest);
    return () => window.removeEventListener("farmfund:open-ai-advisor", handleOpenRequest);
  }, []);

  useEffect(() => () => clearTimeout(replyTimer.current), []);

  function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || isThinking) return;

    // Any question, from a pill or the text box, immediately clears the
    // suggestion rows so the panel moves into active conversation mode.
    setShowSuggestions(false);
    setShowFollowups(false);
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, sender: "user", text: trimmed },
    ]);
    setInputValue("");
    setIsThinking(true);

    replyTimer.current = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, sender: "ai", text: getScriptedReply(trimmed) },
      ]);
      setIsThinking(false);
      setShowFollowups(true); // follow-ups appear only once the answer is done
    }, 1200);
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
          <div className="bg-[#f7f8f6] p-4 flex-1 min-h-0 overflow-y-auto space-y-4">
            {messages.map((m) =>
              m.sender === "ai" ? (
                <div key={m.id} className="flex gap-2">
                  <span className="shrink-0 w-7 h-7 rounded-lg bg-[#2d4027] flex items-center justify-center">
                    <Bot size={14} className="text-white" />
                  </span>
                  <div
                    className={`bg-white border border-gray-200 rounded-2xl p-4 ${textSize} text-gray-800 shadow-sm whitespace-pre-line leading-relaxed ${
                      isExpanded ? "max-w-[75%]" : ""
                    }`}
                  >
                    {m.text}
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
          {showSuggestions && (
            <div className="flex flex-wrap gap-2 p-3 bg-[#f7f8f6] shrink-0">
              {SUGGESTED_PROMPTS.map((prompt) => (
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
          {showFollowups && !isThinking && (
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
              disabled={isThinking}
              className="bg-white border border-gray-200 rounded-full px-5 py-3 text-sm text-gray-700 placeholder-gray-400 flex-1 focus:outline-none focus:ring-2 focus:ring-[#4d6b41] disabled:opacity-70"
            />
            <button
              type="submit"
              disabled={isThinking || !inputValue.trim()}
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