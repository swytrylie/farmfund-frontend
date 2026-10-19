// Text for the AI Advisor user guide (AIGuide.jsx), in English and Filipino.
// Each step can show the same icon the farmer sees on the screen, so they can
// match the guide to the real button.
import {
  Lightbulb,
  Sparkles,
  Sprout,
  Send,
  RotateCcw,
  Maximize2,
  RefreshCw,
  CloudRain,
  MessageCircle,
  ShieldCheck,
  Info,
  ClipboardList,
} from "lucide-react";

export const GUIDE_TABS = ["start", "advisor", "chat", "summary", "notes"];

export const GUIDE = {
  en: {
    title: "How to use the AI Farm Advisor",
    subtitle: "A quick guide to the AI Advisor, the chat button and the AI Summary.",
    languageLabel: "Filipino",
    close: "Got it",
    next: "Next",
    back: "Back",
    tabs: {
      start: "Start here",
      advisor: "AI Advisor",
      chat: "Chat button",
      summary: "AI Summary",
      notes: "Good to know",
    },
    sections: {
      start: {
        intro:
          "The AI Farm Advisor reads your FarmFund records and helps you decide what to plant, how to cut costs, how to handle your loans and budget, and how your farm is earning.",
        steps: [
          {
            icon: Lightbulb,
            title: "AI Advisor page",
            text: "In the menu, go to Insights → AI Advisor. Here you can chat with the advisor and see which crops to plant now in your town.",
          },
          {
            icon: MessageCircle,
            title: "Chat button",
            text: "The round lightbulb button at the bottom right of every page opens a quick chat, so you can ask a question without leaving your page.",
          },
          {
            icon: Sparkles,
            title: "AI Summary page",
            text: "In the menu, go to Insights → AI Summary. It explains your farm's money for the last 30 days in simple words.",
          },
          {
            icon: ClipboardList,
            title: "First, fill in your records",
            text: "The advice is only as good as your records. Add your town and farm size in Farm Profile, then record your income and expenses, crops, budget and loans.",
          },
        ],
      },
      advisor: {
        intro: "Open Insights → AI Advisor in the menu.",
        steps: [
          {
            icon: Sparkles,
            title: "Wait for today's advice",
            text: "The first time each day, the advisor needs up to 20 seconds to read your records and the weather. After that it opens quickly.",
          },
          {
            icon: Sprout,
            title: "What to plant now",
            text: "The cards show crops that fit the current season in your town. Each card says if you can plant now or next month, the estimated profit for your farm size, and when you can harvest. Click the title bar to show or hide the cards.",
          },
          {
            icon: MessageCircle,
            title: "Ask about this",
            text: "Click “Ask about this” on a card to get more details about that crop, like when to plant, costs and risks.",
          },
          {
            icon: CloudRain,
            title: "Yellow rain notice",
            text: "If heavy rain is coming, a yellow notice appears. Wait for the rain to pass before planting vegetables.",
          },
          {
            icon: Send,
            title: "Ask your own question",
            text: "Tap one of the suggested questions, or type your own in the box at the bottom and press Enter or the send button.",
          },
          {
            icon: RotateCcw,
            title: "Start a new conversation",
            text: "The circular arrow next to the text box clears the conversation so you can start again.",
          },
        ],
      },
      chat: {
        intro: "The lightbulb button at the bottom right works on every page.",
        steps: [
          {
            icon: Lightbulb,
            title: "Open the chat",
            text: "Click the lightbulb button. Click it again, or the X, to close it.",
          },
          {
            icon: Maximize2,
            title: "Make it bigger",
            text: "Click the expand button at the top of the chat for a larger window. Click it again to make it small.",
          },
          {
            icon: RefreshCw,
            title: "Follow-up questions",
            text: "After each answer, follow-up questions appear. “Refresh suggestions” brings back the starting questions.",
          },
          {
            icon: MessageCircle,
            title: "Same conversation everywhere",
            text: "The chat button and the AI Advisor page share one conversation, so you can continue where you left off.",
          },
        ],
        examplesTitle: "Questions you can ask",
        examples: [
          "What should I plant this season?",
          "How can I reduce my farm expenses?",
          "When is my next loan payment?",
          "Help me plan my personal budget",
          "How is my farm's profit margin?",
          "What's the weather forecast for my farm this week?",
        ],
        tipsTitle: "Tips for better answers",
        tips: [
          "Ask one thing at a time.",
          "Name the crop, loan or month you mean.",
          "You can ask in English or Filipino.",
          "You can ask up to 8 questions a minute.",
        ],
      },
      summary: {
        intro: "Open Insights → AI Summary in the menu.",
        steps: [
          {
            icon: Sparkles,
            title: "The green box",
            text: "A short summary of your last 30 days, with your main numbers compared with the 30 days before.",
          },
          {
            icon: ClipboardList,
            title: "What's Driving This",
            text: "Four cards explain your income and expenses, crop profits, loans and budget. The colored edge shows how each one is doing.",
          },
          {
            icon: Lightbulb,
            title: "Suggested focus",
            text: "The yellow box is the one thing the advisor thinks you should work on next cycle.",
          },
          {
            icon: RefreshCw,
            title: "Update summary",
            text: "After you add new records, click “Update summary” to get a fresh summary.",
          },
        ],
        colorsTitle: "What the colors mean",
        colors: [
          { swatch: "bg-green-400", text: "Green: doing well" },
          { swatch: "bg-amber-400", text: "Yellow: keep an eye on it" },
          { swatch: "bg-red-400", text: "Red: needs attention" },
          { swatch: "bg-gray-300", text: "Gray: not enough records yet" },
        ],
      },
      notes: {
        steps: [
          {
            icon: Info,
            title: "“Basic answer: the AI is busy”",
            text: "The free AI has a daily limit. When it is reached, you get a basic answer made from your records only. Try again in a few minutes.",
          },
          {
            icon: Sprout,
            title: "Estimates are for planning",
            text: "Profits, prices and harvest dates are estimates. Check with your Municipal Agriculture Office (MAO) before big decisions.",
          },
          {
            icon: CloudRain,
            title: "Weather",
            text: "The forecast comes from Open-Meteo.com. For typhoon warnings, always follow PAGASA.",
          },
          {
            icon: ShieldCheck,
            title: "Your privacy",
            text: "Your name, email and phone number are never sent to the AI. Don't type passwords or account numbers in the chat.",
          },
          {
            icon: MessageCircle,
            title: "The AI can make mistakes",
            text: "Double-check loan and money decisions with your cooperative, lender or MAO.",
          },
        ],
      },
    },
  },

  tl: {
    title: "Paano gamitin ang AI Farm Advisor",
    subtitle: "Maikling gabay sa AI Advisor, sa chat button at sa AI Summary.",
    languageLabel: "English",
    close: "Sige, gets ko na",
    next: "Susunod",
    back: "Bumalik",
    tabs: {
      start: "Simulan dito",
      advisor: "AI Advisor",
      chat: "Chat button",
      summary: "AI Summary",
      notes: "Dapat malaman",
    },
    sections: {
      start: {
        intro:
          "Binabasa ng AI Farm Advisor ang mga record mo sa FarmFund at tinutulungan kang magpasya kung ano ang itatanim, paano bawasan ang gastos, paano hawakan ang utang at budget, at kung paano kumikita ang bukid mo.",
        steps: [
          {
            icon: Lightbulb,
            title: "AI Advisor page",
            text: "Sa menu, pumunta sa Insights → AI Advisor. Dito ka makikipag-chat sa advisor at makikita mo ang mga pananim na bagay itanim ngayon sa bayan mo.",
          },
          {
            icon: MessageCircle,
            title: "Chat button",
            text: "Ang bilog na button na may bumbilya sa kanang ibaba ng bawat page ay nagbubukas ng mabilis na chat, kaya makakapagtanong ka nang hindi umaalis sa page.",
          },
          {
            icon: Sparkles,
            title: "AI Summary page",
            text: "Sa menu, pumunta sa Insights → AI Summary. Ipinapaliwanag nito sa simpleng salita ang pera ng bukid mo sa nakaraang 30 araw.",
          },
          {
            icon: ClipboardList,
            title: "Unahin ang mga record",
            text: "Kasing-ganda lang ng record mo ang payo. Ilagay ang bayan at laki ng bukid sa Farm Profile, saka i-record ang kita at gastos, pananim, budget at utang.",
          },
        ],
      },
      advisor: {
        intro: "Buksan ang Insights → AI Advisor sa menu.",
        steps: [
          {
            icon: Sparkles,
            title: "Hintayin ang payo ngayong araw",
            text: "Sa unang bukas bawat araw, hanggang 20 segundo ang kailangan para basahin ang record mo at ang panahon. Pagkatapos noon, mabilis na itong bumubukas.",
          },
          {
            icon: Sprout,
            title: "Ano ang itatanim ngayon",
            text: "Ipinapakita ng mga card ang mga pananim na bagay sa season ngayon sa bayan mo. Nakasulat kung puwede nang itanim ngayon o sa susunod na buwan, ang tantiyang tubo para sa laki ng bukid mo, at kung kailan maaani. I-click ang pamagat para ipakita o itago ang mga card.",
          },
          {
            icon: MessageCircle,
            title: "Ask about this",
            text: "I-click ang “Ask about this” sa card para malaman pa ang tungkol sa pananim na iyon, gaya ng kailan itatanim, gastos at panganib.",
          },
          {
            icon: CloudRain,
            title: "Dilaw na paalala sa ulan",
            text: "Kapag may paparating na malakas na ulan, may lalabas na dilaw na paalala. Hintaying lumipas ang ulan bago magtanim ng gulay.",
          },
          {
            icon: Send,
            title: "Magtanong ng sarili mong tanong",
            text: "Pindutin ang isa sa mga mungkahing tanong, o mag-type sa kahon sa ibaba at pindutin ang Enter o ang send button.",
          },
          {
            icon: RotateCcw,
            title: "Bagong usapan",
            text: "Ang paikot na arrow sa tabi ng kahon ay nagbubura ng usapan para makapagsimula ka ulit.",
          },
        ],
      },
      chat: {
        intro: "Gumagana ang button na may bumbilya sa kanang ibaba sa bawat page.",
        steps: [
          {
            icon: Lightbulb,
            title: "Buksan ang chat",
            text: "I-click ang button na may bumbilya. I-click ulit, o ang X, para isara.",
          },
          {
            icon: Maximize2,
            title: "Palakihin",
            text: "I-click ang expand button sa itaas ng chat para lumaki ang window. I-click ulit para lumiit.",
          },
          {
            icon: RefreshCw,
            title: "Mga kasunod na tanong",
            text: "Pagkatapos ng bawat sagot, may lalabas na mga kasunod na tanong. Ibinabalik ng “Refresh suggestions” ang mga panimulang tanong.",
          },
          {
            icon: MessageCircle,
            title: "Iisang usapan",
            text: "Iisa ang usapan sa chat button at sa AI Advisor page, kaya maitutuloy mo kung saan ka huminto.",
          },
        ],
        examplesTitle: "Mga puwedeng itanong",
        examples: [
          "Ano ang dapat kong itanim ngayong season?",
          "Paano ko mababawasan ang gastos sa bukid?",
          "Kailan ang susunod kong bayad sa utang?",
          "Tulungan mo akong magplano ng budget sa bahay",
          "Kumusta ang tubo ng bukid ko?",
          "Ano ang lagay ng panahon sa bukid ko ngayong linggo?",
        ],
        tipsTitle: "Para sa mas magandang sagot",
        tips: [
          "Isang tanong lang bawat beses.",
          "Banggitin ang pananim, utang o buwan na tinutukoy mo.",
          "Puwede kang magtanong sa English o Filipino.",
          "Hanggang 8 tanong kada minuto.",
        ],
      },
      summary: {
        intro: "Buksan ang Insights → AI Summary sa menu.",
        steps: [
          {
            icon: Sparkles,
            title: "Ang berdeng kahon",
            text: "Maikling buod ng nakaraang 30 araw, kasama ang mahahalagang numero kumpara sa 30 araw bago noon.",
          },
          {
            icon: ClipboardList,
            title: "What's Driving This",
            text: "Apat na card ang nagpapaliwanag ng kita at gastos, tubo sa pananim, utang at budget. Ipinapakita ng kulay sa gilid kung kumusta ang bawat isa.",
          },
          {
            icon: Lightbulb,
            title: "Suggested focus",
            text: "Ang dilaw na kahon ang isang bagay na dapat mong pagtuunan sa susunod na taniman.",
          },
          {
            icon: RefreshCw,
            title: "Update summary",
            text: "Pagkatapos magdagdag ng bagong record, i-click ang “Update summary” para sa bagong buod.",
          },
        ],
        colorsTitle: "Ibig sabihin ng mga kulay",
        colors: [
          { swatch: "bg-green-400", text: "Berde: maayos" },
          { swatch: "bg-amber-400", text: "Dilaw: bantayan" },
          { swatch: "bg-red-400", text: "Pula: kailangang asikasuhin" },
          { swatch: "bg-gray-300", text: "Abo: kulang pa ang record" },
        ],
      },
      notes: {
        steps: [
          {
            icon: Info,
            title: "“Basic answer: the AI is busy”",
            text: "May limitasyon bawat araw ang libreng AI. Kapag naabot ito, makakakuha ka ng simpleng sagot mula sa record mo lang. Subukan ulit pagkalipas ng ilang minuto.",
          },
          {
            icon: Sprout,
            title: "Tantiya lang ang mga numero",
            text: "Tantiya lang ang tubo, presyo at petsa ng ani. Kumonsulta sa Municipal Agriculture Office (MAO) bago gumawa ng malaking desisyon.",
          },
          {
            icon: CloudRain,
            title: "Panahon",
            text: "Galing sa Open-Meteo.com ang forecast. Para sa babala sa bagyo, laging sundin ang PAGASA.",
          },
          {
            icon: ShieldCheck,
            title: "Ang iyong privacy",
            text: "Hindi kailanman ipinapadala sa AI ang pangalan, email at numero ng telepono mo. Huwag mag-type ng password o account number sa chat.",
          },
          {
            icon: MessageCircle,
            title: "Puwedeng magkamali ang AI",
            text: "I-double check ang mga desisyon sa utang at pera sa kooperatiba, nagpapautang o MAO.",
          },
        ],
      },
    },
  },
};
