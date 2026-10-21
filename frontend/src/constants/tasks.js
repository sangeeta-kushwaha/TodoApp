export const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Not completed" },
  ...STATUSES,
  { value: "overdue", label: "Overdue" },
];

export const PRIORITY_FILTERS = [
  { value: "all", label: "All priorities" },
  ...PRIORITIES,
];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "due", label: "Due date" },
  { value: "priority", label: "Priority" },
  { value: "title", label: "Title" },
];

export const PAGE_SIZE = 8;

export const EMPTY_TASK = {
  title: "",
  description: "",
  priority: "medium",
  status: "pending",
  dueDate: "",
};
