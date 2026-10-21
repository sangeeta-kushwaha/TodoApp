import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error("JWT_SECRET and JWT_REFRESH_SECRET must be set");
  process.exit(1);
}

if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
  console.error("JWT_REFRESH_SECRET must be different from JWT_SECRET");
  process.exit(1);
}

const PORT = process.env.PORT || 8080;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
