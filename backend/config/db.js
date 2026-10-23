import mongoose from "mongoose";
import { seedDatabase } from "./seed.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/zaevyul";

const connectMongoDB = async (retries = 5, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(MONGO_URI, {
        dbName: "zaevyul",
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      console.log("MongoDB connected successfully");
      await seedDatabase();
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${i + 1} failed:`, err.message);
      if (i < retries - 1) {
        console.log(`Retrying MongoDB connection in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        console.error("Could not connect to MongoDB after multiple attempts. Please check network/IP whitelist.");
      }
    }
  }
};

connectMongoDB();

