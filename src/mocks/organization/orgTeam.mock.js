// Mock data for Team & Invitations.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export const ROLE_OPTIONS = ["Financial Manager", "Coordinator", "Staff Member"];

const TEAM_MEMBERS = [
  {
    id: "owner",
    name: "ahshagaah shagh",
    email: "owner@gmail.com",
    role: "Owner",
    status: "active",
    isOwner: true,
  },
  {
    id: "staff-1",
    name: "Lkjh Gfdd",
    email: "lkjh@gmail.com",
    role: "Financial Manager",
    status: "active",
    isOwner: false,
  },
  {
    id: "staff-2",
    name: null, // pending invite — no name yet, shown as a placeholder silhouette
    email: "invited@gmail.com",
    role: "Financial Manager",
    status: "invite-sent",
    isOwner: false,
  },
];

export async function getTeamMembers() {
  return delay(TEAM_MEMBERS);
}

export async function sendInvitation() {
  return delay({ success: true });
}

export async function resendInvitation() {
  return delay({ success: true });
}

export async function cancelInvitation() {
  return delay({ success: true });
}

export async function deactivateAccess() {
  return delay({ success: true });
}

export async function removeFromOrganization() {
  return delay({ success: true });
}