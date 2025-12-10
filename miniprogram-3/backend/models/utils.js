// backend/utils.js
const { MongoClient } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('appointment'); // 数据库名称

  cachedClient = client;
  cachedDb = db;

  console.log("📌 MongoDB connected!");
  return { client, db };
}

module.exports = { connectToDatabase };
