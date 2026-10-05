import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/auth.routes.js";
import todoRoutes from "./src/routes/todo.route.js";
import cors from "cors";

const app = express();
dotenv.config();
app.use(express.json());

app.use(cors());
const PORT = process.env.PORT || 8080;
connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/todo", todoRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
