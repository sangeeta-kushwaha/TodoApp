import mongoose from "mongoose";
import {
  DEFAULT_PAGE_SIZE,
  LIST_PRIORITIES,
  LIST_SORTS,
  LIST_STATUSES,
  MAX_PAGE_SIZE,
  MAX_SEARCH_LENGTH,
} from "../constants/tasks.js";
import { startOfToday } from "./dates.js";

const sorts = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  title: { title: 1, _id: 1 },
  priority: { priorityRank: 1, createdAt: -1, _id: -1 },
  due: { dueMissing: 1, dueDate: 1, _id: 1 },
};

function readString(query, key) {
  if (!Object.prototype.hasOwnProperty.call(query, key)) {
    return { ok: true, value: undefined };
  }

  const value = query[key];
  if (typeof value !== "string") {
    return { ok: false, message: `${key} must be a single value` };
  }

  return { ok: true, value };
}

function readChoice(query, key, allowed, fallback) {
  const read = readString(query, key);
  if (!read.ok) return read;
  if (read.value === undefined || read.value === "") {
    return { ok: true, value: fallback };
  }
  if (!allowed.includes(read.value)) {
    return {
      ok: false,
      message: `${key} must be one of: ${allowed.join(", ")}`,
    };
  }
  return { ok: true, value: read.value };
}

function readPositiveInt(query, key, { fallback, max }) {
  const read = readString(query, key);
  if (!read.ok) return read;
  if (read.value === undefined || read.value === "") {
    return { ok: true, value: fallback };
  }
  if (!/^[1-9]\d*$/.test(read.value)) {
    return { ok: false, message: `${key} must be a positive whole number` };
  }

  const value = Number(read.value);
  if (value > max) {
    return { ok: false, message: `${key} must be ${max} or less` };
  }
  return { ok: true, value };
}

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function openStatusClause() {
  return {
    $or: [
      { status: { $in: ["pending", "in_progress"] } },
      { status: null, completed: { $ne: true } },
    ],
  };
}

function statusClause(status, today) {
  if (status === "all") return null;
  if (status === "in_progress") return { status: "in_progress" };
  if (status === "pending") {
    return {
      $or: [{ status: "pending" }, { status: null, completed: { $ne: true } }],
    };
  }
  if (status === "completed") {
    return {
      $or: [{ status: "completed" }, { status: null, completed: true }],
    };
  }
  if (status === "open") return openStatusClause();

  return {
    $and: [{ dueDate: { $ne: null, $lt: today } }, openStatusClause()],
  };
}

function priorityClause(priority) {
  if (priority === "all") return null;
  if (priority === "medium") {
    return { $or: [{ priority: "medium" }, { priority: null }] };
  }
  return { priority };
}

export function buildTaskListQuery(query, now = new Date()) {
  const status = readChoice(query, "status", LIST_STATUSES, "all");
  if (!status.ok) return status;
  const priority = readChoice(query, "priority", LIST_PRIORITIES, "all");
  if (!priority.ok) return priority;
  const sort = readChoice(query, "sort", LIST_SORTS, "newest");
  if (!sort.ok) return sort;

  const page = readPositiveInt(query, "page", { fallback: 1, max: 10000 });
  if (!page.ok) return page;
  const limit = readPositiveInt(query, "limit", {
    fallback: DEFAULT_PAGE_SIZE,
    max: MAX_PAGE_SIZE,
  });
  if (!limit.ok) return limit;

  const search = readString(query, "q");
  if (!search.ok) return search;
  const q = (search.value || "").trim();
  if (q.length > MAX_SEARCH_LENGTH) {
    return {
      ok: false,
      message: `q must be ${MAX_SEARCH_LENGTH} characters or fewer`,
    };
  }

  const clauses = [];
  const statusFilter = statusClause(status.value, startOfToday(now));
  const priorityFilter = priorityClause(priority.value);
  if (statusFilter) clauses.push(statusFilter);
  if (priorityFilter) clauses.push(priorityFilter);
  if (q) {
    const pattern = escapeRegex(q);
    clauses.push({
      $or: [
        { title: { $regex: pattern, $options: "i" } },
        { description: { $regex: pattern, $options: "i" } },
      ],
    });
  }

  return {
    ok: true,
    page: page.value,
    limit: limit.value,
    sort: sorts[sort.value],
    clauses,
  };
}

export function taskMatch(userId, clauses) {
  const user = new mongoose.Types.ObjectId(userId);
  if (clauses.length === 0) return { user };
  return { $and: [{ user }, ...clauses] };
}

export function listPipeline(match, sort, skip, limit) {
  return [
    { $match: match },
    {
      $addFields: {
        priorityRank: {
          $switch: {
            branches: [
              { case: { $eq: ["$priority", "high"] }, then: 0 },
              { case: { $eq: ["$priority", "low"] }, then: 2 },
            ],
            default: 1,
          },
        },
        dueMissing: {
          $cond: [{ $ifNull: ["$dueDate", false] }, 0, 1],
        },
      },
    },
    { $sort: sort },
    { $skip: skip },
    { $limit: limit },
  ];
}

export function pageMeta(total, page, limit) {
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, pageCount);
  const startIndex = total === 0 ? 0 : (currentPage - 1) * limit;

  return {
    page: currentPage,
    limit,
    total,
    pageCount: total === 0 ? 0 : pageCount,
    start: total === 0 ? 0 : startIndex + 1,
    end: Math.min(startIndex + limit, total),
    skip: total === 0 ? 0 : startIndex,
  };
}
