// utils/db.js
const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected) return mongoose;

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME,
    });

    isConnected = true;
    console.log("MongoDB connected (mongoose)");
    return mongoose;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}

module.exports = { connectDB };
