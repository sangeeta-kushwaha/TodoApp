import mongoose from "mongoose";

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set");
    process.exit(1);
  }

  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (err) {
    console.error("MongoDB connection failed");
    process.exit(1);
  }
};

export default connectDB;
