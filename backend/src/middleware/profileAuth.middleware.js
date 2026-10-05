import jwt from "jsonwebtoken";

const authmiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "authentication token is required" });
    }

    const token = authHeader.split(" ")[1];
    console.log("token----", token);

    if (!token) {
      return res.status(401).json({
        message: "authentication token required",
      });
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decode;
    next();
  } catch (err) {
    res
      .status(401)
      .json({ message: "invalid or expired token", error: err.message });
  }
};

export default authmiddleware;
