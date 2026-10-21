const buckets = new Map();

export function resetRateLimits() {
  buckets.clear();
}

export function rateLimit({ windowMs, max, keyPrefix }) {
  return (req, res, next) => {
    if (process.env.NODE_ENV === "test") return next();

    const now = Date.now();
    const key = `${keyPrefix}:${req.ip || "unknown"}`;
    const recent = (buckets.get(key) || []).filter(
      (timestamp) => now - timestamp < windowMs,
    );

    if (recent.length >= max) {
      const retryAfter = Math.ceil((recent[0] + windowMs - now) / 1000);
      res.set("Retry-After", String(Math.max(retryAfter, 1)));
      return res.status(429).json({
        message: "Too many attempts. Please try again later.",
      });
    }

    recent.push(now);
    buckets.set(key, recent);
    next();
  };
}
