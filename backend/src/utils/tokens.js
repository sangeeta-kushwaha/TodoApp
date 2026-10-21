import crypto from "node:crypto";
import jwt from "jsonwebtoken";

export const ACCESS_MAX_AGE = 15 * 60 * 1000;
export const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export function signAccessToken(userId) {
  return jwt.sign(
    { id: userId, type: "access", jti: crypto.randomUUID() },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );
}

export function signRefreshToken(userId) {
  return jwt.sign(
    { id: userId, type: "refresh", jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" },
  );
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function tokensMatch(token, storedHash) {
  if (!token || !storedHash) return false;

  const actual = Buffer.from(hashToken(token));
  const expected = Buffer.from(storedHash);

  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}
