import { Router } from "express";
import {
  createTodo,
  deleteTodo,
  getTodoStats,
  getTodos,
  updateTodo,
} from "../controllers/todo.controller.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";
import requireAuth from "../middleware/requireAuth.middleware.js";
import {
  validateCreateTodo,
  validateUpdateTodo,
} from "../middleware/todo.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/stats", getTodoStats);
router.get("/", getTodos);
router.post("/", csrfProtection, validateCreateTodo, createTodo);
router.put("/:id", csrfProtection, validateUpdateTodo, updateTodo);
router.delete("/:id", csrfProtection, deleteTodo);

export default router;
