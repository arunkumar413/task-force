const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, ".env") });

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/task-force";

async function connectDB() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected");
}

module.exports = {
  connectDB,
  MONGODB_URI,
};

