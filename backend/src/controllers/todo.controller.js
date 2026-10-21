import mongoose from "mongoose";
import Todo from "../models/todo.model.js";
import { STATUSES } from "../constants/tasks.js";
import { startOfToday } from "../utils/dates.js";
import {
  buildTaskListQuery,
  listPipeline,
  pageMeta,
  taskMatch,
} from "../utils/taskQuery.js";

export function presentTodo(todo) {
  const status = todo.status || (todo.completed ? "completed" : "pending");

  return {
    _id: todo._id,
    title: todo.title,
    description: todo.description,
    priority: todo.priority || "medium",
    status,
    completed: status === "completed",
    dueDate: todo.dueDate ?? null,
    user: todo.user,
    createdAt: todo.createdAt,
    updatedAt: todo.updatedAt,
  };
}

function taskUpdates(body) {
  const updates = {};

  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.dueDate !== undefined) updates.dueDate = body.dueDate;

  if (body.status !== undefined) {
    updates.status = body.status;
    updates.completed = body.status === "completed";
  } else if (body.completed !== undefined) {
    updates.completed = body.completed;
    updates.status = body.completed ? "completed" : "pending";
  }

  return updates;
}

function invalidId(res) {
  return res.status(400).json({ success: false, message: "Invalid task id" });
}

const createTodo = async (req, res) => {
  try {
    const status =
      req.body.status || (req.body.completed ? "completed" : "pending");

    const todo = await Todo.create({
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority || "medium",
      status,
      completed: status === "completed",
      dueDate: req.body.dueDate ?? null,
      user: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Todo created successfully",
      data: presentTodo(todo),
    });
  } catch (err) {
    console.error("Create todo failed");
    return res.status(500).json({
      success: false,
      message: "Failed to create todo",
    });
  }
};

const getTodos = async (req, res) => {
  try {
    const parsed = buildTaskListQuery(req.query);
    if (!parsed.ok) {
      return res.status(400).json({ success: false, message: parsed.message });
    }

    const match = taskMatch(req.user.id, parsed.clauses);
    const total = await Todo.countDocuments(match);
    const meta = pageMeta(total, parsed.page, parsed.limit);
    const todos = await Todo.aggregate(
      listPipeline(match, parsed.sort, meta.skip, parsed.limit),
    ).collation({ locale: "en", strength: 2 });

    return res.status(200).json({
      success: true,
      message: "Todos fetched successfully",
      data: todos.map(presentTodo),
      meta: {
        page: meta.page,
        limit: meta.limit,
        total: meta.total,
        pageCount: meta.pageCount,
        start: meta.start,
        end: meta.end,
      },
    });
  } catch (err) {
    console.error("Get todos failed");
    return res.status(500).json({
      success: false,
      message: "Failed to get todos",
    });
  }
};

const getTodoStats = async (req, res) => {
  try {
    const today = startOfToday();
    const [row] = await Todo.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $addFields: {
          effectiveStatus: {
            $cond: [
              { $in: ["$status", STATUSES] },
              "$status",
              { $cond: [{ $eq: ["$completed", true] }, "completed", "pending"] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$effectiveStatus", "completed"] }, 1, 0],
            },
          },
          inProgress: {
            $sum: {
              $cond: [{ $eq: ["$effectiveStatus", "in_progress"] }, 1, 0],
            },
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$effectiveStatus", "completed"] },
                    { $ne: [{ $ifNull: ["$dueDate", null] }, null] },
                    { $lt: ["$dueDate", today] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const total = row?.total || 0;
    const completed = row?.completed || 0;

    return res.status(200).json({
      success: true,
      message: "Task stats fetched successfully",
      data: {
        total,
        completed,
        pending: total - completed,
        inProgress: row?.inProgress || 0,
        overdue: row?.overdue || 0,
      },
    });
  } catch (err) {
    console.error("Get todo stats failed");
    return res.status(500).json({
      success: false,
      message: "Failed to get task stats",
    });
  }
};

const updateTodo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) return invalidId(res);

    const updates = taskUpdates(req.body);
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required",
      });
    }

    const todo = await Todo.findOneAndUpdate(
      { _id: id, user: req.user.id },
      updates,
      { returnDocument: "after", runValidators: true },
    );

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Todo updated successfully",
      data: presentTodo(todo),
    });
  } catch (err) {
    console.error("Update todo failed");
    return res.status(500).json({
      success: false,
      message: "Failed to update todo",
    });
  }
};

const deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) return invalidId(res);

    const todo = await Todo.findOneAndDelete({
      _id: id,
      user: req.user.id,
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Todo deleted successfully",
    });
  } catch (err) {
    console.error("Delete todo failed");
    return res.status(500).json({
      success: false,
      message: "Failed to delete todo",
    });
  }
};

export { createTodo, getTodoStats, getTodos, updateTodo, deleteTodo };
