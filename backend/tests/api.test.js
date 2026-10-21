import "./env.js";
import assert from "node:assert/strict";
import { after, afterEach, before, describe, it } from "node:test";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/auth.model.js";
import Todo from "../src/models/todo.model.js";

const password = "secret12";
let mongo;

function cookieRows(response) {
  const raw = response.headers["set-cookie"] || [];
  return Array.isArray(raw) ? raw : [raw];
}

function cookieRow(response, name) {
  return cookieRows(response).find((row) => row.startsWith(`${name}=`));
}

function cookieValue(response, name) {
  const row = cookieRow(response, name);
  if (!row) return "";
  return row.split(";")[0].slice(name.length + 1);
}

function signup(agent, email, name = "Ada Lovelace") {
  return agent.post("/api/auth/signup").send({ name, email, password });
}

function login(agent, email) {
  return agent.post("/api/auth/login").send({ email, password });
}

describe("auth and tasks API", { timeout: 120000 }, () => {
  before(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  afterEach(async () => {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
  });

  it("creates an account without returning the password", async () => {
    const response = await request(app)
      .post("/api/auth/signup")
      .send({ name: "Ada Lovelace", email: "ada@example.com", password })
      .expect(201);

    assert.equal(response.body.user.password, undefined);
    assert.equal(response.body.user.email, "ada@example.com");

    const saved = await User.findOne({ email: "ada@example.com" }).select("+password");
    assert.notEqual(saved.password, password);
    assert.equal(await bcrypt.compare(password, saved.password), true);
  });

  it("logs in with httpOnly cookies and rejects bad credentials the same way", async () => {
    const agent = request.agent(app);
    await signup(agent, "ada@example.com");

    const unknown = await request(app)
      .post("/api/auth/login")
      .send({ email: "missing@example.com", password })
      .expect(401);
    const wrong = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "wrongpass" })
      .expect(401);

    assert.equal(unknown.body.message, wrong.body.message);

    const response = await login(agent, "ada@example.com").expect(200);
    assert.equal(response.body.accessToken, undefined);
    assert.equal(response.body.refreshToken, undefined);
    assert.equal(response.body.user.email, "ada@example.com");
    assert.match(cookieRow(response, "accessToken"), /HttpOnly/i);
    assert.match(cookieRow(response, "refreshToken"), /HttpOnly/i);
    assert.match(cookieRow(response, "accessToken"), /Path=\/api/i);
    assert.doesNotMatch(cookieRow(response, "csrfToken"), /HttpOnly/i);
    assert.equal(cookieValue(response, "loggedIn"), "1");

    const me = await agent.get("/api/auth/me").expect(200);
    assert.equal(me.body.user.email, "ada@example.com");
  });

  it("rejects missing, malformed, and expired access tokens", async () => {
    await request(app).get("/api/todo").expect(401);

    await request(app)
      .get("/api/todo")
      .set("Authorization", "Bearer not-a-token")
      .expect(401);

    const user = await request(app)
      .post("/api/auth/signup")
      .send({ name: "Ada Lovelace", email: "ada@example.com", password });

    const expired = jwt.sign(
      {
        id: user.body.user.id,
        type: "access",
        exp: Math.floor(Date.now() / 1000) - 60,
      },
      process.env.JWT_SECRET,
    );
    const wrongType = jwt.sign(
      { id: user.body.user.id, type: "refresh" },
      process.env.JWT_SECRET,
      { expiresIn: "5m" },
    );

    await request(app)
      .get("/api/todo")
      .set("Authorization", `Bearer ${expired}`)
      .expect(401);
    await request(app)
      .get("/api/todo")
      .set("Authorization", `Bearer ${wrongType}`)
      .expect(401);
  });

  it("refreshes a cookie session once, then rejects the old refresh token", async () => {
    const agent = request.agent(app);
    await signup(agent, "ada@example.com");
    const loggedIn = await login(agent, "ada@example.com");
    const oldRefresh = cookieValue(loggedIn, "refreshToken");
    const csrf = cookieValue(loggedIn, "csrfToken");

    await agent.post("/api/auth/refresh").expect(403);
    const refreshed = await agent
      .post("/api/auth/refresh")
      .set("x-csrf-token", csrf)
      .expect(200);
    assert.equal(refreshed.body.accessToken, undefined);

    const nextCsrf = cookieValue(refreshed, "csrfToken");
    const reused = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refreshToken=${oldRefresh}; csrfToken=${csrf}`)
      .set("x-csrf-token", csrf)
      .expect(401);
    assert.equal(reused.body.message, "Invalid or expired refresh token");

    await agent
      .post("/api/auth/refresh")
      .set("x-csrf-token", nextCsrf)
      .expect(401);
  });

  it("lets a user manage only their own tasks", async () => {
    const ada = request.agent(app);
    const grace = request.agent(app);
    await signup(ada, "ada@example.com");
    await signup(grace, "grace@example.com", "Grace Hopper");
    const adaLogin = await login(ada, "ada@example.com");
    const graceLogin = await login(grace, "grace@example.com");
    const adaCsrf = cookieValue(adaLogin, "csrfToken");
    const graceCsrf = cookieValue(graceLogin, "csrfToken");
    const task = {
      title: "Write tests",
      description: "Cover ownership",
      priority: "high",
      dueDate: "2026-10-21",
    };

    await ada.post("/api/todo").send(task).expect(403);
    const created = await ada
      .post("/api/todo")
      .set("x-csrf-token", adaCsrf)
      .send({ ...task, user: graceLogin.body.user.id })
      .expect(201);

    assert.equal(created.body.data.priority, "high");
    assert.equal(created.body.data.status, "pending");
    assert.equal(created.body.data.completed, false);
    assert.equal(String(created.body.data.user), adaLogin.body.user.id);

    const adaList = await ada.get("/api/todo").expect(200);
    const graceList = await grace.get("/api/todo").expect(200);
    assert.equal(adaList.body.data.length, 1);
    assert.equal(graceList.body.data.length, 0);

    await grace
      .put(`/api/todo/${created.body.data._id}`)
      .set("x-csrf-token", graceCsrf)
      .send({ title: "Stolen" })
      .expect(404);
    await grace
      .delete(`/api/todo/${created.body.data._id}`)
      .set("x-csrf-token", graceCsrf)
      .expect(404);

    const updated = await ada
      .put(`/api/todo/${created.body.data._id}`)
      .set("x-csrf-token", adaCsrf)
      .send({ completed: true })
      .expect(200);
    assert.equal(updated.body.data.completed, true);
    assert.equal(updated.body.data.status, "completed");
    assert.equal(updated.body.data.title, "Write tests");

    await ada
      .put("/api/todo/not-an-id")
      .set("x-csrf-token", adaCsrf)
      .send({ title: "Nope" })
      .expect(400);
    await ada
      .post("/api/todo")
      .set("x-csrf-token", adaCsrf)
      .send({ title: "No", description: "ok" })
      .expect(400);

    await ada
      .delete(`/api/todo/${created.body.data._id}`)
      .set("x-csrf-token", adaCsrf)
      .expect(200);
    const afterDelete = await ada.get("/api/todo").expect(200);
    assert.equal(afterDelete.body.data.length, 0);
  });

  it("accepts a bearer token without a CSRF cookie", async () => {
    const signupResponse = await request(app).post("/api/auth/signup").send({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password,
    });
    const token = jwt.sign(
      { id: signupResponse.body.user.id, type: "access" },
      process.env.JWT_SECRET,
      { expiresIn: "5m" },
    );

    const created = await request(app)
      .post("/api/todo")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "API client task",
        description: "Created with a bearer token",
        status: "in_progress",
      })
      .expect(201);

    assert.equal(created.body.data.status, "in_progress");
    assert.equal(created.body.data.completed, false);
  });

  it("filters, sorts, and pages one user's tasks", async () => {
    const ada = request.agent(app);
    const grace = request.agent(app);
    await signup(ada, "ada@example.com");
    await signup(grace, "grace@example.com", "Grace Hopper");
    const adaLogin = await login(ada, "ada@example.com");
    const graceLogin = await login(grace, "grace@example.com");
    const adaCsrf = cookieValue(adaLogin, "csrfToken");
    const graceCsrf = cookieValue(graceLogin, "csrfToken");

    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    const day = (date) => {
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const dateNumber = String(date.getDate()).padStart(2, "0");
      return `${date.getFullYear()}-${month}-${dateNumber}`;
    };

    async function add(agent, csrf, body) {
      const response = await agent
        .post("/api/todo")
        .set("x-csrf-token", csrf)
        .send(body)
        .expect(201);
      return response.body.data;
    }

    await add(ada, adaCsrf, {
      title: "beta release",
      description: "Ship the board",
      priority: "low",
      status: "pending",
      dueDate: day(yesterday),
    });
    await add(ada, adaCsrf, {
      title: "Alpha notes",
      description: "Explain auth",
      priority: "high",
      status: "in_progress",
      dueDate: day(today),
    });
    await add(ada, adaCsrf, {
      title: "Done already",
      description: "Old due date",
      priority: "medium",
      status: "completed",
      dueDate: day(yesterday),
    });
    await add(grace, graceCsrf, {
      title: "Alpha notes",
      description: "Grace owns this",
      priority: "high",
    });
    await Todo.collection.insertOne({
      title: "Legacy task",
      description: "Missing new fields",
      completed: false,
      user: new mongoose.Types.ObjectId(adaLogin.body.user.id),
      createdAt: new Date("2020-01-01T00:00:00.000Z"),
      updatedAt: new Date("2020-01-01T00:00:00.000Z"),
    });

    const overdue = await ada.get("/api/todo").query({ status: "overdue" }).expect(200);
    assert.deepEqual(
      overdue.body.data.map((todo) => todo.title),
      ["beta release"],
    );
    assert.equal(overdue.body.meta.total, 1);

    const byTitle = await ada
      .get("/api/todo")
      .query({ sort: "title", limit: 10 })
      .expect(200);
    assert.deepEqual(
      byTitle.body.data.map((todo) => todo.title),
      ["Alpha notes", "beta release", "Done already", "Legacy task"],
    );

    const byPriority = await ada
      .get("/api/todo")
      .query({ sort: "priority", limit: 10 })
      .expect(200);
    assert.deepEqual(
      byPriority.body.data.map((todo) => todo.priority),
      ["high", "medium", "medium", "low"],
    );

    const page = await ada.get("/api/todo").query({ page: 2, limit: 2 }).expect(200);
    assert.equal(page.body.data.length, 2);
    assert.equal(page.body.meta.total, 4);
    assert.equal(page.body.meta.page, 2);
    assert.equal(page.body.meta.pageCount, 2);
    assert.equal(page.body.meta.start, 3);

    const clamped = await ada.get("/api/todo").query({ page: 9, limit: 2 }).expect(200);
    assert.equal(clamped.body.meta.page, 2);
    assert.equal(clamped.body.data.length, 2);

    const search = await ada.get("/api/todo").query({ q: "a.b" }).expect(200);
    assert.equal(search.body.meta.total, 0);
    const literal = await ada.get("/api/todo").query({ q: "Alpha" }).expect(200);
    assert.equal(literal.body.meta.total, 1);
    assert.equal(literal.body.data[0].user, adaLogin.body.user.id);

    const legacy = await ada.get("/api/todo").query({ q: "Legacy", priority: "medium" }).expect(200);
    assert.equal(legacy.body.data.length, 1);
    assert.equal(legacy.body.data[0].status, "pending");

    const stats = await ada.get("/api/todo/stats").expect(200);
    assert.deepEqual(stats.body.data, {
      total: 4,
      completed: 1,
      pending: 3,
      inProgress: 1,
      overdue: 1,
    });
    const graceStats = await grace.get("/api/todo/stats").expect(200);
    assert.equal(graceStats.body.data.total, 1);

    await ada.get("/api/todo").query({ status: "later" }).expect(400);
    await ada.get("/api/todo").query({ page: "0" }).expect(400);
    await request(app).get("/api/todo/stats").expect(401);
  });

  it("logs out and blocks the old session", async () => {
    const agent = request.agent(app);
    await signup(agent, "ada@example.com");
    const loggedIn = await login(agent, "ada@example.com");

    await agent
      .post("/api/auth/logout")
      .set("x-csrf-token", cookieValue(loggedIn, "csrfToken"))
      .expect(200);
    await agent.get("/api/auth/me").expect(401);
  });

  it("rejects invalid JSON", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{")
      .expect(400);

    assert.equal(response.body.message, "Invalid JSON body");
  });
});
