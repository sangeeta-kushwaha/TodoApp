import { Router } from "express";
import {
  validateLogin,
  validateSignup,
} from "../middleware/auth.middleware.js";
import { login, signup, getMe } from "../controllers/auth.controller.js";
import authmiddleware from "../middleware/profileAuth.middleware.js";

const router = Router();

router.post("/signup", validateSignup, signup);

router.post("/login", validateLogin, login);

router.get("/me", authmiddleware, getMe);

export default router;
