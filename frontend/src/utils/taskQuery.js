import { PAGE_SIZE } from "../constants/tasks";

const statuses = new Set([
  "all",
  "open",
  "pending",
  "in_progress",
  "completed",
  "overdue",
]);
const priorities = new Set(["all", "low", "medium", "high"]);
const sorts = new Set(["newest", "oldest", "due", "priority", "title"]);

export function parseTaskSearchParams(searchParams) {
  const status = searchParams.get("status") || "all";
  const priority = searchParams.get("priority") || "all";
  const sort = searchParams.get("sort") || "newest";
  const pageNumber = Number(searchParams.get("page") || "1");
  const page =
    Number.isInteger(pageNumber) && pageNumber >= 1 && pageNumber <= 10000
      ? pageNumber
      : 1;

  return {
    q: (searchParams.get("q") || "").trim().slice(0, 100),
    status: statuses.has(status) ? status : "all",
    priority: priorities.has(priority) ? priority : "all",
    sort: sorts.has(sort) ? sort : "newest",
    page,
  };
}

export function taskSearchParams(query) {
  const params = new URLSearchParams();
  const q = query.q.trim();
  if (q) params.set("q", q);
  if (query.status !== "all") params.set("status", query.status);
  if (query.priority !== "all") params.set("priority", query.priority);
  if (query.sort !== "newest") params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));
  return params;
}

export function taskRequestParams(query) {
  const params = {
    page: query.page,
    limit: PAGE_SIZE,
    sort: query.sort,
  };
  const q = query.q.trim();
  if (q) params.q = q;
  if (query.status !== "all") params.status = query.status;
  if (query.priority !== "all") params.priority = query.priority;
  return params;
}

export function hasTaskFilters(query) {
  return Boolean(query.q.trim() || query.status !== "all" || query.priority !== "all");
}
