// backend/routes/appointment.js
const express = require("express");
const router = express.Router();
const { getDb } = require("../utils/db");
const { ObjectId } = require("mongodb");

// 兼容：GET /api/appointment/getAll
router.get("/getAll", async (req, res) => {
  try {
    const { db } = await getDb();
    const data = await db.collection("appointments").find().toArray();
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 兼容：GET /api/appointment/getByStudent?studentUsername=xxx
router.get("/getByStudent", async (req, res) => {
  try {
    const { studentUsername } = req.query;
    const { db } = await getDb();
    const data = await db.collection("appointments").find({ studentUsername }).toArray();
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 兼容：GET /api/appointment/getByTeacher?teacherId=xxx
router.get("/getByTeacher", async (req, res) => {
  try {
    const { teacherId } = req.query;
    const { db } = await getDb();
    const data = await db.collection("appointments").find({ teacherId }).toArray();
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 原始 /（返回所有）
router.get("/", async (req, res) => {
  try {
    const { db } = await getDb();
    const data = await db.collection("appointments").find().toArray();
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 预约：POST /api/appointment/book
router.post("/book", async (req, res) => {
  const { teacherId, teacherName, day, slot, studentName, studentUsername } = req.body;
  try {
    const { db } = await getDb();

    if (!teacherId || day === undefined || slot === undefined || !studentUsername) {
      return res.json({ success: false, message: "参数不完整" });
    }

    const conflict = await db.collection("appointments").findOne({ teacherId, day, slot });
    if (conflict) return res.json({ success: false, message: "该教师该时间段已被预约" });

    const schedule = await db.collection("schedules").findOne({ teacherId });
    const valid = schedule && Array.isArray(schedule.slots) && schedule.slots.some(s => s.day === day && s.slot === slot);
    if (!valid) return res.json({ success: false, message: "该教师该时间段不可预约" });

    const result = await db.collection("appointments").insertOne({
      teacherId, teacherName, day, slot, studentName, studentUsername, bookingTime: new Date()
    });

    res.json({ success: true, data: { insertedId: result.insertedId } });

  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 取消预约：POST /api/appointment/cancel
router.post("/cancel", async (req, res) => {
  const { bookingId, studentUsername } = req.body;

  if (!bookingId) return res.json({ success: false, message: "bookingId required" });

  try {
    const { db } = await getDb();

    let _id;
    try {
      _id = new ObjectId(bookingId);
    } catch (e) {
      return res.json({ success: false, message: "bookingId invalid" });
    }

    const record = await db.collection("appointments").findOne({ _id });
    if (!record) return res.json({ success: false, message: "预约不存在" });
    if (record.studentUsername !== studentUsername) return res.json({ success: false, message: "无权取消此预约" });

    await db.collection("appointments").deleteOne({ _id });
    res.json({ success: true });

  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

module.exports = router;
