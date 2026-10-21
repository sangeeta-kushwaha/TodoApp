import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseDueDate } from "../src/utils/dates.js";
import {
  validateLoginBody,
  validateSignupBody,
} from "../src/middleware/auth.middleware.js";
import {
  validateCreateTodoBody,
  validateUpdateTodoBody,
} from "../src/middleware/todo.middleware.js";

const validUser = {
  name: "Ada Lovelace",
  email: "Ada@Example.com",
  password: "secret12",
};

describe("auth validation", () => {
  it("accepts a signup and normalizes the email", () => {
    const result = validateSignupBody(validUser);
    assert.equal(result.ok, true);
    assert.equal(result.data.email, "ada@example.com");
    assert.equal(result.data.name, "Ada Lovelace");
  });

  it("rejects a short password and an invalid email", () => {
    const signup = validateSignupBody({ ...validUser, password: "short" });
    const login = validateLoginBody({ email: "not-an-email", password: "secret12" });

    assert.equal(signup.ok, false);
    assert.match(signup.message, /6 characters/);
    assert.equal(login.ok, false);
    assert.equal(login.message, "Invalid email address");
  });
});

describe("task validation", () => {
  it("accepts a task and keeps optional fields", () => {
    const result = validateCreateTodoBody({
      title: "  Write tests  ",
      description: "Cover auth and tasks",
      priority: "high",
      dueDate: "2026-10-21",
    });

    assert.equal(result.ok, true);
    assert.equal(result.data.title, "Write tests");
    assert.equal(result.data.dueDate.getFullYear(), 2026);
    assert.equal(result.data.dueDate.getMonth(), 9);
    assert.equal(result.data.dueDate.getDate(), 21);
  });

  it("rejects an impossible due date and an empty update", () => {
    const dueDate = validateCreateTodoBody({
      title: "Write tests",
      description: "Cover auth and tasks",
      dueDate: "2026-02-31",
    });
    const empty = validateUpdateTodoBody({});

    assert.equal(dueDate.ok, false);
    assert.match(dueDate.message, /due date/i);
    assert.equal(empty.ok, false);
    assert.match(empty.message, /at least one field/i);
  });

  it("allows marking a task complete without sending the title again", () => {
    const result = validateUpdateTodoBody({ completed: false });
    assert.equal(result.ok, true);
    assert.equal(result.data.completed, false);
  });
});

describe("parseDueDate", () => {
  it("treats an empty value as clearing the date", () => {
    assert.deepEqual(parseDueDate(""), { ok: true, value: null });
    assert.deepEqual(parseDueDate(undefined), { ok: true, value: undefined });
  });
});
