export function normalizeTodo(todo) {
  const status = todo.status || (todo.completed ? "completed" : "pending");
  const priority = todo.priority || "medium";

  return {
    ...todo,
    status,
    priority,
    completed: status === "completed",
  };
}

export function isOverdue(todo, now = new Date()) {
  const normalized = normalizeTodo(todo);
  if (!normalized.dueDate || normalized.status === "completed") return false;

  const due = new Date(normalized.dueDate);
  if (Number.isNaN(due.getTime())) return false;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  return dueDay < today;
}

export function statusLabel(status) {
  if (status === "in_progress") return "In Progress";
  if (status === "completed") return "Completed";
  return "Pending";
}

export function priorityLabel(priority) {
  if (priority === "high") return "High";
  if (priority === "low") return "Low";
  return "Medium";
}

export function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
