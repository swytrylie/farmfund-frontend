// Mock data for Cooperative Profile, following the same pattern as every
// other page in the app: async getter wrapped in a simulated delay, with a
// separate save function for the update action. CooperativeProfile.jsx
// originally embedded this data directly in the component instead — an
// inconsistency with the rest of the app, fixed here.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

const COOPERATIVE_PROFILE = {
  name: "Kasama Farmers Association",
  registrationNo: "CDA-2015-00812",
  address: "Dagupan City, Pangasinan",
  dateEstablished: "2015-01-15",
  status: "verified",
};

export async function getCooperativeProfile() {
  return delay(COOPERATIVE_PROFILE);
}

export async function saveCooperativeProfile() {
  return delay({ success: true });
}