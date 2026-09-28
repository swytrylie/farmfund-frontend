// Mock data for Admin User Management.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export const TYPE_FILTERS = ["All", "Farmers", "Cooperative Owners", "Financial Managers"];

export const USER_TYPE_OPTIONS = [
  "Farmer",
  "Cooperative Owner",
  "Financial Manager",
  "Individual Lender",
];

const USERS = [
  {
    id: "user-1",
    name: "Nelmar Lauron",
    email: "nelmar@gmail.com",
    type: "Farmer",
    org: "Lauron Family Farm",
    status: "active",
    joined: "Mar 2021",
  },
  {
    id: "user-2",
    name: "Ahshagaah Shagh",
    email: "ahsha@gmail.com",
    type: "Cooperative Owner",
    org: "Kasama Farmers Association",
    status: "active",
    joined: "Jan 2015",
  },
  {
    id: "user-3",
    name: "Albert Einstein",
    email: "albert@gmail.com",
    type: "Financial Manager",
    org: "Kasama Farmers Association",
    status: "active",
    joined: "Feb 2025",
  },
  {
    id: "user-4",
    name: "Bato Dela Rosa",
    email: "bato@gmail.com",
    type: "Farmer",
    org: "Dela Rosa Livestock",
    status: "suspended",
    joined: "Feb 2025",
  },
];

export async function getUsers() {
  return delay(USERS);
}

export async function suspendUser() {
  return delay({ success: true });
}

export async function activateUser() {
  return delay({ success: true });
}

export async function deleteUser() {
  return delay({ success: true });
}

export async function sendPasswordReset() {
  return delay({ success: true });
}

export async function createUser() {
  return delay({ success: true });
}

export async function updateUser() {
  return delay({ success: true });
}