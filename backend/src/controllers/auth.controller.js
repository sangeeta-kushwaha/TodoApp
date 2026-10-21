import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/auth.model.js";
import { clearAuthCookies, setAuthCookies, setCsrfCookie } from "../utils/cookies.js";
import { hashToken, signAccessToken, signRefreshToken, tokensMatch } from "../utils/tokens.js";

let dummyHashPromise;

function getDummyHash() {
  if (!dummyHashPromise) {
    dummyHashPromise = bcrypt.hash("not-a-real-password", 10);
  }
  return dummyHashPromise;
}

function presentUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "User created successfully",
      user: presentUser(user),
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    console.error("Signup failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    const passwordHash = user?.password || (await getDummyHash());
    const isPasswordValid = await bcrypt.compare(password, passwordHash);

    if (!user || !isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    await User.updateOne(
      { _id: user._id },
      { $set: { refreshTokenHash: hashToken(refreshToken) } },
    );

    setAuthCookies(res, { accessToken, refreshToken });

    return res.status(200).json({
      message: "Login successful",
      user: presentUser(user),
    });
  } catch (err) {
    console.error("Login failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email createdAt");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!req.cookies?.csrfToken) setCsrfCookie(res);

    return res.status(200).json({
      message: "User authenticated",
      user: presentUser(user),
    });
  } catch (err) {
    console.error("Get profile failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

const refreshToken = async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token || typeof token !== "string") {
    return res.status(401).json({ message: "Refresh token is required" });
  }

  const usingCookie = Boolean(req.cookies?.refreshToken);

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    if (!decoded?.id || decoded.type !== "refresh") {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const user = await User.findById(decoded.id).select("+refreshTokenHash");
    const matches = user && tokensMatch(token, user.refreshTokenHash);

    if (!user || !matches) {
      if (user) {
        await User.updateOne(
          { _id: user._id },
          { $set: { refreshTokenHash: null } },
        );
      }
      clearAuthCookies(res);
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const accessToken = signAccessToken(user._id);
    const nextRefreshToken = signRefreshToken(user._id);

    await User.updateOne(
      { _id: user._id },
      { $set: { refreshTokenHash: hashToken(nextRefreshToken) } },
    );

    setAuthCookies(res, { accessToken, refreshToken: nextRefreshToken });

    if (usingCookie) {
      return res.status(200).json({
        message: "Access token refreshed successfully",
      });
    }

    return res.status(200).json({
      message: "Access token refreshed successfully",
      accessToken,
      refreshToken: nextRefreshToken,
    });
  } catch (err) {
    clearAuthCookies(res);
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

const logout = async (req, res) => {
  try {
    const refresh = req.cookies?.refreshToken;
    const access = req.cookies?.accessToken;
    let userId = null;

    if (refresh) {
      try {
        const decoded = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET);
        if (decoded?.type === "refresh") userId = decoded.id;
      } catch {
        userId = null;
      }
    }

    if (!userId && access) {
      try {
        const decoded = jwt.verify(access, process.env.JWT_SECRET);
        if (decoded?.type === "access") userId = decoded.id;
      } catch {
        userId = null;
      }
    }

    if (userId) {
      await User.updateOne({ _id: userId }, { $set: { refreshTokenHash: null } });
    }

    clearAuthCookies(res);
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { signup, login, getMe, refreshToken, logout };
