import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const token = bearer || req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Authentication token is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id || decoded.type !== "access") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    if (!mongoose.isValidObjectId(decoded.id)) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    req.user = { id: decoded.id };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default requireAuth;
