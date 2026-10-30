const MONGO_DB_URI = process.env.MONGO_DB_URI || "mongodb://localhost:27017/mydatabase";
const SERVER_PORT = process.env.PORT || process.env.SERVER_PORT || 3000;
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const PASSWORD_OTP_TTL_MS = 10 * 60 * 1000;
const PASSWORD_OTP_RESEND_MS = 60 * 1000;
const PASSWORD_OTP_MAX_ATTEMPTS = 5;
const PASSWORD_MIN_LENGTH = 8;
const INVITE_OTP_TTL_MS = 24 * 60 * 60 * 1000;
const INVITE_MAX_ROWS = 100;

const RESOURCE_ACTIONS = ["read", "write", "update", "delete"];

const CORE_RESOURCES = [
  {
    key: "employee",
    name: "Employees",
    description: "People in the organization",
  },
  {
    key: "task",
    name: "Tasks",
    description: "Work items and todos",
  },
  {
    key: "department",
    name: "Departments",
    description: "Teams and department tree",
  },
  {
    key: "organization",
    name: "Organization",
    description: "Tenant settings",
  },
  {
    key: "role",
    name: "Roles",
    description: "Roles assigned to employees",
  },
  {
    key: "resource",
    name: "Resources",
    description: "Protected resources and their actions",
  },
  {
    key: "profile",
    name: "Profile",
    description: "Signed-in employee profile",
  },
  {
    key: "report",
    name: "Reports",
    description: "Analytics and reporting",
  },
  {
    key: "billing",
    name: "Billing",
    description: "Plans and invoices",
  },
  {
    key: "document",
    name: "Documents",
    description: "Files and documents",
  },
  {
    key: "audit",
    name: "Audit log",
    description: "Security and activity history",
  },
  {
    key: "setting",
    name: "Settings",
    description: "Application configuration",
  },
];

module.exports = {
  MONGO_DB_URI,
  SERVER_PORT,
  SESSION_MAX_AGE_MS,
  PASSWORD_OTP_TTL_MS,
  PASSWORD_OTP_RESEND_MS,
  PASSWORD_OTP_MAX_ATTEMPTS,
  PASSWORD_MIN_LENGTH,
  INVITE_OTP_TTL_MS,
  INVITE_MAX_ROWS,
  RESOURCE_ACTIONS,
  CORE_RESOURCES,
};

