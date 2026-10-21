import { describe, expect, it } from "vitest";
import { parseTaskSearchParams, taskRequestParams, taskSearchParams } from "./taskQuery.js";
import { isOverdue } from "./tasks.js";
import { validateLoginForm, validateTaskForm } from "./validators.js";

describe("task queries", () => {
  it("marks only an open task due before today as overdue", () => {
    const now = new Date(2026, 9, 21, 12);
    expect(
      isOverdue(
        { status: "in_progress", dueDate: new Date(2026, 9, 20) },
        now,
      ),
    ).toBe(true);
    expect(
      isOverdue(
        { status: "completed", dueDate: new Date(2026, 9, 1) },
        now,
      ),
    ).toBe(false);
    expect(
      isOverdue(
        { status: "pending", dueDate: new Date(2026, 9, 21) },
        now,
      ),
    ).toBe(false);
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
