import { useState } from "react";
import { Lightbulb, Bot, Maximize2, X, Send } from "lucide-react";

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

export default function AIAdvisorWidget() {
  const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: "welcome", sender: "ai", text: AI_WELCOME_MESSAGE },
  ]);
  const [inputValue, setInputValue] = useState("");

  function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, sender: "user", text: trimmed },
    ]);
    setInputValue("");

    // TODO: replace with a real AI API call once the backend exists.
    // No mock reply is generated here on purpose — this just records what
    // the person sent until there's a real advisor to answer it.
  }

  function handleSend(e) {
    e.preventDefault();
    sendMessage(inputValue);
  }

  return (
    <>
      {/* Floating chat panel */}
      {isAiAdvisorOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[520px] bg-[#f5f0eb] rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#2d4027] text-white p-4 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                <Bot size={18} />
              </span>
              <span className="font-bold text-sm">AI Farm Advisor</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                // TODO: wire up an actual expanded/maximized view later
                className="text-white/70 hover:text-white transition-colors"
                aria-label="Expand"
              >
                <Maximize2 size={16} />
              </button>
              <button
                onClick={() => setIsAiAdvisorOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Message body */}
          <div className="bg-[#f3f0e8] p-4 flex-1 overflow-y-auto space-y-4">
            {messages.map((m) =>
              m.sender === "ai" ? (
                <div key={m.id} className="flex gap-2">
                  <span className="shrink-0 w-7 h-7 rounded-lg bg-[#2d4027] flex items-center justify-center">
                    <Bot size={14} className="text-white" />
                  </span>
                  <div className="bg-white rounded-2xl p-4 text-xs text-gray-800 shadow-sm border border-gray-100 whitespace-pre-line leading-relaxed">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex justify-end">
                  <div className="bg-[#2d4027] text-white rounded-2xl p-3 text-xs max-w-[80%]">
                    {m.text}
                  </div>
                </div>
              )
            )}
          </div>

          {/* Suggested prompt pills */}
          <div className="flex flex-wrap gap-1.5 p-3 bg-[#f5f0eb]">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="bg-white border border-gray-200 hover:bg-gray-100 text-[11px] font-medium text-gray-700 px-3 py-1.5 rounded-full cursor-pointer transition"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input bar */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-[#e8e4de] border-t border-gray-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about your farm finances..."
              className="bg-white rounded-full px-4 py-2 text-xs text-gray-700 placeholder-gray-400 border border-gray-200 flex-1 focus:outline-none"
            />
            <button
              type="submit"
              className="text-emerald-600 hover:text-emerald-700 cursor-pointer p-1"
              aria-label="Send"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Floating lightbulb toggle button */}
      <button
        onClick={() => setIsAiAdvisorOpen((open) => !open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#1c3016] hover:bg-[#26401e] text-white shadow-lg flex items-center justify-center transition-colors"
        aria-label="Toggle AI Farm Advisor"
      >
        <Lightbulb size={24} />
        <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-[#1c3016]" />
      </button>
    </>
  );
}