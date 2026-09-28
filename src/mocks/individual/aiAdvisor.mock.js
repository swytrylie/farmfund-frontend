// Mock data for the full-page AI Farm Advisor view, including scripted
// replies for the suggested prompts. Only "Analyze my finances" had an
// exact reply specified — the other 5 prompt replies and the generic
// fallback (for anything typed freely) are invented placeholders in the
// same tone/style, not real figures. Swap getAIResponse's body for a real
// AI API call once the backend exists.

const MOCK_DELAY_MS = 300;
const AI_REPLY_DELAY_MS = 700; // slightly longer, simulates the AI "thinking"

function delay(value, ms = MOCK_DELAY_MS) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const AI_WELCOME_MESSAGE = `Magandang araw, Manuel! I'm your AI Farm Advisor.

Based on your records this month:
• Total Income: ₱58,200
• Total Expenses: ₱12,590
• Net Surplus: ₱45,610

Your farm is in a healthy position this month. You have two active loans totaling ₱151,500 remaining. Would you like budgeting tips for the upcoming wet season planting?`;

export const SUGGESTED_PROMPTS = [
  "How can I reduce my farm expenses?",
  "Advise me on my current loans",
  "What's in my income trend?",
  "Help me plan my personal budget",
  "How is my farm's profit margin?",
  "Analyze my finances",
];

// Keyed by the exact prompt text. Only "Analyze my finances" was given by
// the spec — the rest are invented, plausible placeholders.
const PROMPT_RESPONSES = {
  "How can I reduce my farm expenses?":
    "Your biggest expense category this month is Irrigation at ₱27,400. Consider staggering watering schedules to off-peak hours, and look into a cooperative bulk-buying arrangement for Seeds & Inputs — that alone could shave 5-10% off your largest line items.",

  "Advise me on my current loans":
    "You have two active loans: LANDBANK Agriculture (₱87,500 remaining, due Sep 5) and Agrarian Reform Fund (₱64,000 remaining, due Sep 15). Since LANDBANK carries the nearer due date and larger balance, prioritize that payment first to avoid any late fees.",

  "What's in my income trend?":
    "Your income has grown steadily from ₱38,000 in March to ₱58,200 in August — a 53% increase over six months, largely driven by your corn and rice harvests. If this trend holds, you're on pace for a strong wet season.",

  "Help me plan my personal budget":
    "Based on your net surplus of ₱45,610 this month, a reasonable split would be 50% toward loan repayment, 30% reinvested into next season's inputs, and 20% set aside as a buffer for unexpected costs like equipment repairs.",

  "How is my farm's profit margin?":
    "Your current profit margin is approximately 78% (₱45,610 net surplus against ₱58,200 total income) — a healthy figure for this time of year. Keeping expenses below ₱15,000/month would maintain this margin through the next quarter.",

  "Analyze my finances":
    "Your debt-to-income ratio is approximately 2.6:1. To improve this, consider reducing input costs through bulk cooperative purchasing, and prioritize the LANDBANK loan since it carries the higher monthly obligation.",
};

const FALLBACK_RESPONSE =
  "I don't have a specific answer for that yet, but based on your current records, your farm is in a healthy financial position this month. Try one of the suggested questions below, or ask me something more specific about your income, expenses, or loans.";

export async function getAdvisorPageData() {
  return delay({
    welcomeMessage: AI_WELCOME_MESSAGE,
    suggestedPrompts: SUGGESTED_PROMPTS,
  });
}

// Looks up a scripted reply for a known prompt (case/whitespace-insensitive),
// or returns the generic fallback for anything else typed freely.
export async function getAIResponse(userText) {
  const normalized = userText.trim().toLowerCase();
  const match = Object.keys(PROMPT_RESPONSES).find(
    (prompt) => prompt.toLowerCase() === normalized
  );
  const reply = match ? PROMPT_RESPONSES[match] : FALLBACK_RESPONSE;
  return delay(reply, AI_REPLY_DELAY_MS);
}