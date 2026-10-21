import { describe, expect, it } from "vitest";
import { parseTaskSearchParams, taskRequestParams, taskSearchParams } from "./taskQuery.js";
import { getTaskStats, isOverdue, paginate, queryTasks } from "./tasks.js";
import { validateLoginForm, validateTaskForm } from "./validators.js";

const now = new Date(2026, 9, 21, 12);

function task(overrides) {
  return {
    _id: overrides._id,
    title: overrides.title,
    description: overrides.description || "Details",
    status: overrides.status || "pending",
    priority: overrides.priority || "medium",
    completed: overrides.status === "completed",
    dueDate: overrides.dueDate || null,
    createdAt: overrides.createdAt,
  };
}

describe("task queries", () => {
  const todos = [
    task({
      _id: "1",
      title: "Ship dashboard",
      description: "Layout and cards",
      priority: "high",
      status: "in_progress",
      dueDate: new Date(2026, 9, 20),
      createdAt: "2026-10-18T10:00:00.000Z",
    }),
    task({
      _id: "2",
      title: "Write README",
      priority: "low",
      status: "completed",
      dueDate: new Date(2026, 9, 1),
      createdAt: "2026-10-19T10:00:00.000Z",
    }),
    task({
      _id: "3",
      title: "Plan interview",
      description: "Explain auth",
      priority: "medium",
      status: "pending",
      dueDate: new Date(2026, 9, 21),
      createdAt: "2026-10-20T10:00:00.000Z",
    }),
  ];

  it("counts open, completed, and overdue tasks from the data", () => {
    const stats = getTaskStats(todos, now);
    expect(stats).toMatchObject({
      total: 3,
      completed: 1,
      pending: 2,
      inProgress: 1,
      overdue: 1,
    });
    expect(isOverdue(todos[1], now)).toBe(false);
    expect(isOverdue(todos[2], now)).toBe(false);
  });

  it("filters by search, status, and priority, then sorts", () => {
    const overdue = queryTasks(todos, { status: "overdue" }, now);
    expect(overdue.map((todo) => todo._id)).toEqual(["1"]);

    const byTitle = queryTasks(todos, { search: "plan", sort: "title" }, now);
    expect(byTitle).toHaveLength(1);
    expect(byTitle[0].title).toBe("Plan interview");

    const highFirst = queryTasks(todos, { sort: "priority" }, now);
    expect(highFirst.map((todo) => todo.priority)).toEqual([
      "high",
      "medium",
      "low",
    ]);

    const open = queryTasks(todos, { status: "open" }, now);
    expect(open.map((todo) => todo._id)).toEqual(["3", "1"]);
  });

  it("keeps task filters in the URL and the API query", () => {
    const parsed = parseTaskSearchParams(
      new URLSearchParams("q=plan&status=overdue&priority=high&sort=due&page=2"),
    );
    expect(parsed).toEqual({
      q: "plan",
      status: "overdue",
      priority: "high",
      sort: "due",
      page: 2,
    });
    expect(taskSearchParams(parsed).toString()).toBe(
      "q=plan&status=overdue&priority=high&sort=due&page=2",
    );
    expect(taskRequestParams(parsed)).toMatchObject({
      q: "plan",
      status: "overdue",
      priority: "high",
      sort: "due",
      page: 2,
      limit: 8,
    });
    expect(parseTaskSearchParams(new URLSearchParams("status=nope&page=0")).status).toBe(
      "all",
    );
  });

  it("paginates and clamps the page", () => {
    const page = paginate(todos, 9, 2);
    expect(page.page).toBe(2);
    expect(page.pageCount).toBe(2);
    expect(page.items).toHaveLength(1);
    expect(page.start).toBe(3);
  });

  it("explains what is missing on a task form", () => {
    expect(validateTaskForm({ title: "Hi", description: "" }).title).toMatch(/3/);
    expect(validateTaskForm({ title: "", description: "Enough" }).title).toMatch(
      /required/i,
    );
    expect(validateLoginForm({ email: "ada", password: "secret12" }).email).toMatch(
      /valid email/i,
    );
  });
});
