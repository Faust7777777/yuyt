const express = require("express");
const router = express.Router();
const { getDb } = require("../utils/db");

router.get("/getByStudent", async (req, res) => {
  const { studentUsername } = req.query;
  const { db } = await getDb();
  const rows = await db.collection("appointments").find({ studentUsername }).toArray();
  res.json({ success: true, data: rows });
});

router.get("/getByTeacher", async (req, res) => {
  const { teacherId } = req.query;
  const { db } = await getDb();
  const rows = await db.collection("appointments").find({ teacherId }).toArray();
  res.json({ success: true, data: rows });
});

router.post("/book", async (req, res) => {
  const { teacherId, teacherName, day, slot, studentName, studentUsername } = req.body;

  const { db } = await getDb();

  const conflict = await db.collection("appointments")
    .findOne({ teacherId, day, slot });

  if (conflict) {
    return res.json({ success: false, message: "该时间段已被预约" });
  }

  await db.collection("appointments").insertOne({
    teacherId,
    teacherName,
    day,
    slot,
    studentName,
    studentUsername,
    time: new Date()
  });

  res.json({ success: true });
});

router.post("/cancel", async (req, res) => {
  const { bookingId, studentUsername } = req.body;
  const { db, ObjectId } = await getDb();

  const record = await db.collection("appointments").findOne({ _id: new ObjectId(bookingId) });

  if (!record) return res.json({ success: false, message: "预约不存在" });

  if (record.studentUsername !== studentUsername) {
    return res.json({ success: false, message: "无权取消此预约" });
  }

  await db.collection("appointments").deleteOne({ _id: new ObjectId(bookingId) });

  res.json({ success: true });
});

module.exports = router;
