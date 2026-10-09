import { Router } from "express";
import {
  createTodo,
  getTodos,
  updateTodo,
  deleteTodo,
} from "../controllers/todo.controller.js";
import authmiddleware from "../middleware/profileAuth.middleware.js";
import validateTodo from "../middleware/todo.middleware.js";

const router = Router();

router.post("/", authmiddleware, validateTodo, createTodo);
router.get("/", authmiddleware, getTodos);
router.put("/:id", authmiddleware, validateTodo, updateTodo);
router.delete("/:id", authmiddleware, deleteTodo);

export default router;
