import { Router } from "express";
import {
  getMe,
  login,
  logout,
  refreshToken,
  signup,
} from "../controllers/auth.controller.js";
import { validateLogin, validateSignup } from "../middleware/auth.middleware.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";
import { rateLimit } from "../middleware/rateLimit.middleware.js";
import requireAuth from "../middleware/requireAuth.middleware.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: "auth",
});

function csrfForRefresh(req, res, next) {
  const refreshCookie = req.cookies?.refreshToken;
  const refreshBody = req.body?.refreshToken;
  if (!refreshCookie && typeof refreshBody === "string" && refreshBody) {
    return next();
  }
  return csrfProtection(req, res, next);
}

router.post("/signup", authLimiter, validateSignup, signup);
router.post("/login", authLimiter, validateLogin, login);
router.get("/me", requireAuth, getMe);
router.post("/refresh", authLimiter, csrfForRefresh, refreshToken);
router.post("/logout", csrfProtection, logout);

export default router;
