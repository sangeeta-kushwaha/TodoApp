import { z } from "zod";
import {
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  PRIORITIES,
  STATUSES,
  TITLE_MAX,
  TITLE_MIN,
} from "../constants/tasks.js";
import { parseDueDate } from "../utils/dates.js";

const todoShape = {
  title: z
    .string()
    .trim()
    .min(TITLE_MIN, {
      message: "Title must be at least 3 characters long",
    })
    .max(TITLE_MAX, { message: "Title must be 100 characters or fewer" }),
  description: z
    .string()
    .trim()
    .min(DESCRIPTION_MIN, {
      message: "Description must be at least 3 characters long",
    })
    .max(DESCRIPTION_MAX, {
      message: "Description must be 500 characters or fewer",
    }),
  priority: z.enum(PRIORITIES, {
    message: "Priority must be low, medium, or high",
  }),
  status: z.enum(STATUSES, {
    message: "Status must be pending, in_progress, or completed",
  }),
  dueDate: z.union([z.string(), z.null()]),
  completed: z.boolean({ message: "Completed must be true or false" }),
};

const createTodoSchema = z.object({
  title: todoShape.title,
  description: todoShape.description,
  priority: todoShape.priority.optional(),
  status: todoShape.status.optional(),
  dueDate: todoShape.dueDate.optional(),
  completed: todoShape.completed.optional(),
});

const updateTodoSchema = z
  .object({
    title: todoShape.title.optional(),
    description: todoShape.description.optional(),
    priority: todoShape.priority.optional(),
    status: todoShape.status.optional(),
    dueDate: todoShape.dueDate.optional(),
    completed: todoShape.completed.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

function firstIssue(error) {
  return error.issues?.[0]?.message || "Invalid input";
}

function withDueDate(data) {
  if (!Object.prototype.hasOwnProperty.call(data, "dueDate")) {
    return { ok: true, data };
  }

  const dueDate = parseDueDate(data.dueDate);
  if (!dueDate.ok) return dueDate;
  return { ok: true, data: { ...data, dueDate: dueDate.value } };
}

export function validateCreateTodoBody(body) {
  const result = createTodoSchema.safeParse(body);
  if (!result.success) return { ok: false, message: firstIssue(result.error) };
  return withDueDate(result.data);
}

export function validateUpdateTodoBody(body) {
  const result = updateTodoSchema.safeParse(body);
  if (!result.success) return { ok: false, message: firstIssue(result.error) };
  return withDueDate(result.data);
}

function respond(res, result) {
  return res.status(400).json({ success: false, message: result.message });
}

const validateCreateTodo = (req, res, next) => {
  const result = validateCreateTodoBody(req.body);
  if (!result.ok) return respond(res, result);
  req.body = result.data;
  next();
};

const validateUpdateTodo = (req, res, next) => {
  const result = validateUpdateTodoBody(req.body);
  if (!result.ok) return respond(res, result);
  req.body = result.data;
  next();
};

export { validateCreateTodo, validateUpdateTodo };
