import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { rateLimit, resetRateLimits } from "../src/middleware/rateLimit.middleware.js";

const originalEnv = process.env.NODE_ENV;

function run(middleware, ip) {
  return new Promise((resolve) => {
    const req = { ip };
    const res = {
      statusCode: 200,
      headers: {},
      set(name, value) {
        this.headers[name] = value;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        resolve({ status: this.statusCode, body, headers: this.headers });
      },
    };

    middleware(req, res, () => resolve({ status: 200, body: null, headers: {} }));
  });
}

describe("rate limiter", () => {
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    resetRateLimits();
  });

  it("returns 429 after the limit and skips itself during tests", async () => {
    process.env.NODE_ENV = "development";
    const limit = rateLimit({ windowMs: 60_000, max: 2, keyPrefix: "unit" });

    assert.equal((await run(limit, "10.0.0.1")).status, 200);
    assert.equal((await run(limit, "10.0.0.1")).status, 200);
    const blocked = await run(limit, "10.0.0.1");
    assert.equal(blocked.status, 429);
    assert.match(blocked.body.message, /too many attempts/i);
    assert.ok(blocked.headers["Retry-After"]);
    assert.equal((await run(limit, "10.0.0.2")).status, 200);

    process.env.NODE_ENV = "test";
    const skipped = rateLimit({ windowMs: 60_000, max: 1, keyPrefix: "skipped" });
    assert.equal((await run(skipped, "10.0.0.1")).status, 200);
    assert.equal((await run(skipped, "10.0.0.1")).status, 200);
  });
});
