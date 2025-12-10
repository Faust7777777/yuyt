// backend/utils/db.js
const { MongoClient, ObjectId } = require('mongodb');
const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('MONGO_URI not found in env');
  process.exit(1);
}

let cachedClient = null;
let cachedDb = null;

async function getDb() {
  if (cachedDb) return { db: cachedDb, ObjectId };
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  const dbName = process.env.DB_NAME || 'teacherBookingDB';
  const db = client.db(dbName);
  cachedClient = client;
  cachedDb = db;
  console.log('Connected to MongoDB:', dbName);
  return { db, ObjectId };
}

module.exports = { getDb };
