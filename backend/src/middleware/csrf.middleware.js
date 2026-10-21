import crypto from "node:crypto";

function safeEqual(leftValue, rightValue) {
  if (typeof leftValue !== "string" || typeof rightValue !== "string") {
    return false;
  }

  const left = Buffer.from(leftValue);
  const right = Buffer.from(rightValue);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function csrfProtection(req, res, next) {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }

  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ") && header.slice(7).trim()) {
    return next();
  }

  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.get("x-csrf-token");

  if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
    return res.status(403).json({ message: "Invalid CSRF token" });
  }

  next();
}
