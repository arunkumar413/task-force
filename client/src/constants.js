export const API_URL = process.env.REACT_APP_API_URL;
export const API_KEY = process.env.REACT_APP_API_KEY;

export const PRIORITY_OPTIONS = [
  {
    option: "Low",
    value: "Low",
    selected: false,
  },
  {
    option: "Medium",
    value: "Medium",
    selected: false,
  },
  {
    option: "High",
    value: "High",
    selected: false,
  },
  {
    option: "Urgent",
    value: "Urgent",
    selected: false,
  },
];

export const STATUS_OPTIONS = [
  {
    option: "In progress",
    value: "In progress",
  },
  {
    option: "Done",
    value: "Done",
  },
  {
    option: "Backlog",
    value: "Backlog",
  },
  {
    option: "Cancelled",
    value: "Cancelled",
  },
];

export const ALL_LABELS = [
  {
    name: "UI/UX",
    description: "User interface and  user experience",
    value: "UI/UX",
  },
  {
    name: "Documentation",
    description: "Documentation",
    value: "Documentation",
  },
  {
    name: "Testing",
    description: "A label for testing",
    value: "Testing",
  },
  {
    name: "Frontend",
    description: "A frontend web developmnet team",
    value: "Frontend",
  },
  {
    name: "Backend",
    description: "A backend web developmnet team",
    value: "Backend",
  },
];
