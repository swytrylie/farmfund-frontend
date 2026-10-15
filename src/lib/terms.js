// Terms and Conditions / data-privacy notice shown (and agreed to) at sign-up.
//
// DRAFT WORDING for a school project. It describes what FarmFund actually does
// with data today, but it is not legal advice — have it reviewed (school
// adviser / a lawyer) before real use.
//
// When the wording changes in a way people should agree to again, change
// TERMS_VERSION here AND in the backend's utils/terms.js. The version the
// person saw is stored with their consent.

export const TERMS_VERSION = "2026-10";
export const TERMS_UPDATED = "October 2026";

// Where people can send privacy requests. Fill in a real inbox before launch;
// until then the text points them to the cooperative / FarmFund administrator.
export const SUPPORT_EMAIL = "";

export const TERMS_SECTIONS = [
  {
    title: "1. About FarmFund",
    paragraphs: [
      "FarmFund is a web platform for farmers and farmer cooperatives to manage loans, repayments, farm records and reports. By creating an account you agree to these Terms and Conditions and to the handling of your personal data described below.",
    ],
  },
  {
    title: "2. Your account",
    items: [
      "Give true and current information. Organizations must be registered and sign up through an authorized person, who becomes the organization's Owner.",
      "An organization account is reviewed and approved by a FarmFund administrator before it can be used.",
      "Keep your password private. You are responsible for what happens under your account. Tell us right away if you think someone else has used it.",
      "We may suspend an account that breaks these terms, is used to deceive others, or puts the platform or other users at risk.",
    ],
  },
  {
    title: "3. Personal data we collect",
    paragraphs: ["Depending on how you use FarmFund, we collect and store:"],
    items: [
      "Account details: your first and last name, email address, and a one-way scrambled (hashed) copy of your password — we cannot read your password.",
      "For organizations: the organization's name and contact details, and who its members are.",
      "What you enter while using the platform: farm and farm-profile information, loans, repayments and payment records, financial records, certificates or documents you upload, and messages or announcements sent to you.",
      "Security and activity information: when and from what kind of device and network address you log in, failed login attempts, and a record of important actions on the platform (an audit trail).",
      "Your consent record: the date and the version of these terms you agreed to.",
    ],
  },
  {
    title: "4. Why we use your data",
    items: [
      "To create and secure your account, verify your email and let you log in.",
      "To run the features you use: loans and repayments, reminders, reports, certificates and cooperative management.",
      "To send service emails and in-app notices, such as verification codes, payment reminders and security alerts.",
      "To protect the platform: detecting misuse, investigating problems and keeping backups.",
      "We do not sell your personal data and we do not use it for advertising.",
    ],
  },
  {
    title: "5. Who can see your data",
    items: [
      "You can see your own information.",
      "If you belong to a cooperative, its authorized members (for example the Owner and Financial Managers) can see the loan and financial information that belongs to that cooperative, according to their role.",
      "FarmFund administrators can see account and activity information needed to run and protect the platform.",
      "Service providers that host the platform, store data and files, and send email process data for us only so that FarmFund can run.",
      "We share data with authorities only when the law requires it.",
    ],
  },
  {
    title: "6. How we protect and keep your data",
    items: [
      "Connections to FarmFund are encrypted, passwords are stored hashed, and access is limited by account and role.",
      "We keep your data while your account is active. When an account or cooperative is deleted by an administrator, it is held in an archive for 30 days so it can be restored, and then permanently removed. Copies in system backups may remain for a limited time afterwards.",
      "Login activity records are deleted automatically after 90 days.",
      "No system is perfectly secure. If a breach affecting your data happens, we will notify the people affected as the law requires.",
    ],
  },
  {
    title: "7. Your rights",
    paragraphs: [
      "Under the Philippine Data Privacy Act of 2012 (Republic Act 10173) you have the right to be informed about how your data is used, to access it, to correct it, to object to its use, to ask for it to be blocked or deleted, to receive a copy, to claim compensation if you are harmed by misuse, and to complain to the National Privacy Commission (privacy.gov.ph).",
      "You can correct many details yourself in your account settings. For anything else, contact us (section 10).",
    ],
  },
  {
    title: "8. Your responsibilities",
    items: [
      "Do not enter false loan, payment or identity information, and do not use someone else's account.",
      "Do not try to break into, overload or misuse the platform or other people's data.",
      "Only add other people's personal data (for example a borrower's) if you are allowed to.",
    ],
  },
  {
    title: "9. Changes to these terms",
    paragraphs: [
      "We may update these terms. When the changes are important we will ask you to agree again; otherwise the newest version applies from the date shown on it.",
    ],
  },
  {
    title: "10. Contact",
    paragraphs: [
      SUPPORT_EMAIL
        ? `For questions or privacy requests, write to ${SUPPORT_EMAIL}.`
        : "For questions or privacy requests, contact your cooperative or the FarmFund administrator.",
    ],
  },
];