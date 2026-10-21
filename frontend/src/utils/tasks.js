const priorityRank = { high: 0, medium: 1, low: 2 };

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

export function getTaskStats(todos, now = new Date()) {
  const normalized = todos.map(normalizeTodo);
  const completed = normalized.filter((todo) => todo.status === "completed").length;
  const inProgress = normalized.filter(
    (todo) => todo.status === "in_progress",
  ).length;

  return {
    total: normalized.length,
    completed,
    pending: normalized.length - completed,
    inProgress,
    overdue: normalized.filter((todo) => isOverdue(todo, now)).length,
  };
}

export function queryTasks(
  todos,
  { search = "", status = "all", priority = "all", sort = "newest" } = {},
  now = new Date(),
) {
  const needle = search.trim().toLowerCase();

  const filtered = todos.map(normalizeTodo).filter((todo) => {
    const haystack = `${todo.title} ${todo.description}`.toLowerCase();
    const matchesSearch = haystack.includes(needle);
    const matchesStatus =
      status === "all"
        ? true
        : status === "overdue"
          ? isOverdue(todo, now)
          : status === "open"
            ? todo.status !== "completed"
            : todo.status === status;
    const matchesPriority = priority === "all" || todo.priority === priority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return sortTasks(filtered, sort);
}

export function sortTasks(todos, sort) {
  const items = [...todos];

  items.sort((left, right) => {
    if (sort === "oldest") return time(left.createdAt) - time(right.createdAt);
    if (sort === "title") {
      return left.title.localeCompare(right.title, undefined, {
        sensitivity: "base",
      });
    }
    if (sort === "priority") {
      return priorityRank[left.priority] - priorityRank[right.priority];
    }
    if (sort === "due") return compareDue(left, right);
    return time(right.createdAt) - time(left.createdAt);
  });

  return items;
}

function compareDue(left, right) {
  if (!left.dueDate && !right.dueDate) return 0;
  if (!left.dueDate) return 1;
  if (!right.dueDate) return -1;
  return time(left.dueDate) - time(right.dueDate);
}

function time(value) {
  const date = new Date(value);
  const stamp = date.getTime();
  return Number.isNaN(stamp) ? 0 : stamp;
}

export function paginate(items, page, pageSize) {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), pageCount);
  const startIndex = (currentPage - 1) * pageSize;

  return {
    items: items.slice(startIndex, startIndex + pageSize),
    page: currentPage,
    pageCount,
    total,
    start: total === 0 ? 0 : startIndex + 1,
    end: Math.min(startIndex + pageSize, total),
  };
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
