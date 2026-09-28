// Mock data for the Farm Profile page. Seeded from the real logged-in
// user's first/last name — NOT hardcoded to "Nelmar Lauron" like the
// original spec's example text, since that's the exact bug already fixed
// twice elsewhere in this app (AI Advisor, AI Summary). Farm name defaults
// to "{lastName} Family Farm" the same way AI Summary derives it, but is a
// genuinely editable field here, unlike there.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export const FARM_TYPE_OPTIONS = [
  "Crop farming",
  "Livestock",
  "Mixed - crops and livestock",
  "Mixed - crops and dairy",
  "Aquaculture",
];

export const MEMBERSHIP_TYPE_OPTIONS = [
  "Regular Member",
  "Associate Member",
  "Probationary Member",
];

export async function getFarmProfile(user) {
  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const farmName = user?.lastName ? `${user.lastName} Family Farm` : "";

  return delay({
    statusPills: ["PhilGAP Certified", "KFA Member", "Titled Owner"],

    personalInfo: {
      fullName,
      email: "",
      phone: "",
      nationalId: "",
    },

    farmDetails: {
      farmName,
      location: "Dagupan City, Pangasinan",
      farmSizeHectares: "2.5",
      farmType: "Mixed - crops and dairy",
      primaryCrops: "Rice, yellow corn, ampalaya",
      livestock: "2 carabaos, native chickens",
    },

    registration: {
      kfaRegNo: "KFA-2021-NAK-00342",
      rsbsaId: "01-23-45-678-000123",
      registeredSince: "March 2021",
      membershipType: "Regular Member",
      philGap: { status: "Certified", idNumber: "" },
      landTitle: { status: "Titled Owner", registryNumber: "" },
      organicCert: { status: "Not applied" },
      coopStanding: "",
      documents: [
        { name: "RSBSA_Registration.pdf", verified: true },
        { name: "KFA Membership Certificate.pdf", verified: true },
        { name: "PhilGap_Certificate_2026.pdf", verified: true },
      ],
    },

    security: {
      loginAlertsEnabled: true,
    },
  });
}

// Simulates saving one section of the profile — swap for a real
// authedRequest(...) PATCH call once the backend exists.
export async function saveFarmProfileSection() {
  return delay({ success: true });
}