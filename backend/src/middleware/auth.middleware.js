import { z } from "zod";

const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Name should be at least 2 characters long" })
    .max(50, { message: "Name must be 50 characters or fewer" }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password should be at least 6 characters long" })
    .max(72, { message: "Password must be 72 characters or fewer" }),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password should be at least 6 characters long" })
    .max(72, { message: "Password must be 72 characters or fewer" }),
});

function firstIssue(error) {
  return error.issues?.[0]?.message || "Invalid input";
}

export function validateSignupBody(body) {
  const result = signupSchema.safeParse(body);
  if (!result.success) return { ok: false, message: firstIssue(result.error) };
  return { ok: true, data: result.data };
}

export function validateLoginBody(body) {
  const result = loginSchema.safeParse(body);
  if (!result.success) return { ok: false, message: firstIssue(result.error) };
  return { ok: true, data: result.data };
}

const validateSignup = (req, res, next) => {
  const result = validateSignupBody(req.body);
  if (!result.ok) return res.status(400).json({ message: result.message });
  req.body = result.data;
  next();
};

const validateLogin = (req, res, next) => {
  const result = validateLoginBody(req.body);
  if (!result.ok) return res.status(400).json({ message: result.message });
  req.body = result.data;
  next();
};

export { validateSignup, validateLogin };
