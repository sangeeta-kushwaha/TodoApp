import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildTaskListQuery, escapeRegex, pageMeta } from "../src/utils/taskQuery.js";

describe("task list query", () => {
  it("uses defaults for an empty query", () => {
    const parsed = buildTaskListQuery({});
    assert.equal(parsed.ok, true);
    assert.equal(parsed.page, 1);
    assert.equal(parsed.limit, 8);
    assert.deepEqual(parsed.sort, { createdAt: -1, _id: -1 });
    assert.deepEqual(parsed.clauses, []);
  });

  it("rejects unknown filters and oversized pages", () => {
    assert.equal(buildTaskListQuery({ status: "later" }).ok, false);
    assert.equal(buildTaskListQuery({ priority: ["high"] }).ok, false);
    assert.equal(buildTaskListQuery({ page: "0" }).ok, false);
    assert.equal(buildTaskListQuery({ limit: "51" }).ok, false);
    assert.equal(buildTaskListQuery({ q: "a".repeat(101) }).ok, false);
  });

  it("escapes search text and keeps overdue before today", () => {
    const now = new Date(2026, 9, 21, 15, 30);
    const parsed = buildTaskListQuery(
      { q: "a.b+", status: "overdue", priority: "high", sort: "due" },
      now,
    );

    assert.equal(parsed.ok, true);
    assert.equal(escapeRegex("a.b+"), "a\\.b\\+");
    assert.equal(parsed.clauses[2].$or[0].title.$regex, "a\\.b\\+");
    assert.equal(parsed.clauses[0].$and[0].dueDate.$lt.getTime(), new Date(2026, 9, 21).getTime());
    assert.deepEqual(parsed.sort, { dueMissing: 1, dueDate: 1, _id: 1 });
  });

  it("clamps the reported page to the last page that has tasks", () => {
    const meta = pageMeta(3, 9, 2);
    assert.equal(meta.page, 2);
    assert.equal(meta.pageCount, 2);
    assert.equal(meta.skip, 2);
    assert.equal(meta.start, 3);
    assert.equal(meta.end, 3);

    const empty = pageMeta(0, 4, 8);
    assert.equal(empty.page, 1);
    assert.equal(empty.total, 0);
    assert.equal(empty.pageCount, 0);
    assert.equal(empty.start, 0);
  });
});
