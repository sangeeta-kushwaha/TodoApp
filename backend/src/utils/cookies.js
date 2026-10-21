import crypto from "node:crypto";
import { ACCESS_MAX_AGE, REFRESH_MAX_AGE } from "./tokens.js";

function sharedCookieOptions() {
  const requested = (process.env.COOKIE_SAMESITE || "lax").toLowerCase();
  const sameSite = ["lax", "strict", "none"].includes(requested)
    ? requested
    : "lax";

  let secure = false;
  if (process.env.COOKIE_SECURE === "true" || sameSite === "none") {
    secure = true;
  } else if (process.env.COOKIE_SECURE === "false") {
    secure = false;
  } else {
    secure = process.env.NODE_ENV === "production";
  }

  return { sameSite, secure };
}

export function setCsrfCookie(res) {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie("csrfToken", token, {
    ...sharedCookieOptions(),
    httpOnly: false,
    path: "/",
    maxAge: REFRESH_MAX_AGE,
  });
  return token;
}

export function setAuthCookies(res, { accessToken, refreshToken }) {
  const shared = sharedCookieOptions();

  res.cookie("accessToken", accessToken, {
    ...shared,
    httpOnly: true,
    path: "/api",
    maxAge: ACCESS_MAX_AGE,
  });

  res.cookie("refreshToken", refreshToken, {
    ...shared,
    httpOnly: true,
    path: "/api/auth",
    maxAge: REFRESH_MAX_AGE,
  });

  res.cookie("loggedIn", "1", {
    ...shared,
    httpOnly: false,
    path: "/",
    maxAge: REFRESH_MAX_AGE,
  });

  setCsrfCookie(res);
}

export function clearAuthCookies(res) {
  const shared = sharedCookieOptions();

  res.clearCookie("accessToken", { ...shared, httpOnly: true, path: "/api" });
  res.clearCookie("refreshToken", {
    ...shared,
    httpOnly: true,
    path: "/api/auth",
  });
  res.clearCookie("loggedIn", { ...shared, httpOnly: false, path: "/" });
  res.clearCookie("csrfToken", { ...shared, httpOnly: false, path: "/" });
}
