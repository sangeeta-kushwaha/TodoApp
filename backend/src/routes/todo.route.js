import { Router } from "express";
import {
  createTodo,
  getTodos,
  updateTodo,
  deleteTodo,
} from "../controllers/todo.controller.js";
import authmiddleware from "../middleware/profileAuth.middleware.js";

const router = Router();

router.post("/", authmiddleware, createTodo);
router.get("/", authmiddleware, getTodos);
router.put("/:id", authmiddleware, updateTodo);
router.delete("/:id", authmiddleware, deleteTodo);

export default router;
