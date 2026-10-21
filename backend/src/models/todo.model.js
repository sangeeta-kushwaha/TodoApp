import mongoose from "mongoose";
import { PRIORITIES, STATUSES } from "../constants/tasks.js";

const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: STATUSES,
      default: "pending",
    },
    priority: {
      type: String,
      enum: PRIORITIES,
      default: "medium",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

todoSchema.index({ user: 1, createdAt: -1 });
todoSchema.index({ user: 1, status: 1, priority: 1, createdAt: -1 });
todoSchema.index({ user: 1, dueDate: 1 });

const Todo = mongoose.model("Todo", todoSchema);

export default Todo;
