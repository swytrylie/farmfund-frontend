// The farm location is chosen from a list, not typed: every FarmFund farm
// is in the province of Pangasinan, so the province is fixed and the farmer
// picks one of its 4 cities or 44 municipalities.
export const PROVINCE = "Pangasinan";

const MUNICIPALITIES = [
  "Agno", "Aguilar", "Alcala", "Anda", "Asingan", "Balungao", "Bani", "Basista",
  "Bautista", "Bayambang", "Binalonan", "Binmaley", "Bolinao", "Bugallon", "Burgos",
  "Calasiao", "Dasol", "Infanta", "Labrador", "Laoac", "Lingayen", "Mabini",
  "Malasiqui", "Manaoag", "Mangaldan", "Mangatarem", "Mapandan", "Natividad",
  "Pozorrubio", "Rosales", "San Fabian", "San Jacinto", "San Manuel", "San Nicolas",
  "San Quintin", "Santa Barbara", "Santa Maria", "Santo Tomas", "Sison", "Sual",
  "Tayug", "Umingan", "Urbiztondo", "Villasis",
];
const CITIES = ["Alaminos City", "Dagupan City", "San Carlos City", "Urdaneta City"];

// One list, in alphabetical order (cities sit among the municipalities).
export const PLACES = [...MUNICIPALITIES, ...CITIES].sort((a, b) => a.localeCompare(b, "en"));

// The text saved on the farm: "Lingayen, Pangasinan".
export const addressFor = (place) => (place ? `${place}, ${PROVINCE}` : "");

// Which place a saved address points at, or "" when it is empty or was typed
// freely before this list existed ("Dagupan, Pangasinan" still matches
// "Dagupan City").
export function placeFromAddress(address) {
  const first = String(address || "").split(",")[0].trim().toLowerCase();
  if (!first) return "";
  return PLACES.find((p) => p.toLowerCase() === first || p.toLowerCase().replace(/ city$/, "") === first) || "";
}