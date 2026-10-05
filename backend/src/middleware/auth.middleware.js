import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2, {
    message: "Name should be at least 2 characters long",
  }),

  email: z.string().email({
    message: "Invalid email address",
  }),

  password: z.string().min(6, {
    message: "Password should be at least 6 characters long",
  }),
});

const loginSchema = z.object({
  email: z.string().email({
    message: "Invalid email address",
  }),

  password: z.string().min(6, {
    message: "Password should be at least 6 characters long",
  }),
});

const validateSignup = (req, res, next) => {
  try {
    signupSchema.parse(req.body);

    next();
  } catch (err) {
    return res.status(400).json({
      message: err.issues[0].message,
    });
  }
};

const validateLogin = (req, res, next) => {
  try {
    loginSchema.parse(req.body);

    next();
  } catch (err) {
    return res.status(400).json({
      message: err.issues[0].message,
    });
  }
};

export { validateSignup, validateLogin };
