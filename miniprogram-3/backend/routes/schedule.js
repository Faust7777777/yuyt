const express = require("express");
const router = express.Router();
const { getDb } = require("../utils/db");

router.get("/getAll", async (req, res) => {
  const { db } = await getDb();
  const rows = await db.collection("schedules").find().toArray();
  res.json({ success: true, data: rows });
});

router.get("/get", async (req, res) => {
  const { teacherId } = req.query;
  const { db } = await getDb();
  const row = await db.collection("schedules").findOne({ teacherId });
  res.json({ success: true, data: row || null });
});

router.post("/save", async (req, res) => {
  const { teacherId, slots } = req.body;

  if (!teacherId) {
    return res.json({ success: false, message: "teacherId required" });
  }

  const { db } = await getDb();

  await db.collection("schedules").updateOne(
    { teacherId },
    { $set: { slots: slots || [], updateTime: new Date() } },
    { upsert: true }
  );

  res.json({ success: true });
});

module.exports = router;
