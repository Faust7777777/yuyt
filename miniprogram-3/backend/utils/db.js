// backend/utils/db.js
const { MongoClient, ObjectId } = require("mongodb");

let cachedClient = null;
let cachedDb = null;

async function getDb() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb, ObjectId };
  }

  const uri = process.env.MONGO_URI;
  const dbName = process.env.DB_NAME;

  if (!uri) throw new Error("❌ MONGO_URI 未设置");
  if (!dbName) throw new Error("❌ DB_NAME 未设置");

  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db(dbName);

  console.log("✅ MongoDB Connected:", dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db, ObjectId };
}

module.exports = { getDb };
