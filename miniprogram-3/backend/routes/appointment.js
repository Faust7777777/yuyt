const express = require("express");
const router = express.Router();
const { getDb } = require("../utils/db");
const { ObjectId } = require("mongodb");

// 获取所有预约
router.get("/", async (req, res) => {
  try {
    const { db } = await getDb();
    const data = await db.collection("appointments").find().toArray();
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 学生预约
router.post("/book", async (req, res) => {
  const { teacherId, teacherName, day, slot, studentName, studentUsername } = req.body;
  try {
    const { db } = await getDb();

    const conflict = await db.collection("appointments").findOne({ teacherId, day, slot });
    if (conflict) return res.json({ success: false, message: "该教师该时间段已被预约" });

    const schedule = await db.collection("schedules").findOne({ teacherId });
    const valid = schedule?.slots?.some(s => s.day === day && s.slot === slot);
    if (!valid) return res.json({ success: false, message: "该教师该时间段不可预约" });

    await db.collection("appointments").insertOne({
      teacherId, teacherName, day, slot, studentName, studentUsername,
      bookingTime: new Date()
    });

    res.json({ success: true });

  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 学生查看自己的预约
router.get("/student", async (req, res) => {
  const { studentUsername } = req.query;
  try {
    const { db } = await getDb();
    const data = await db.collection("appointments").find({ studentUsername }).toArray();
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 教师查看自己的预约
router.get("/teacher", async (req, res) => {
  const { teacherId } = req.query;
  try {
    const { db } = await getDb();
    const data = await db.collection("appointments").find({ teacherId }).toArray();
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 取消预约
router.post("/cancel", async (req, res) => {
  const { bookingId, studentUsername } = req.body;

  try {
    const { db } = await getDb();
    const record = await db.collection("appointments").findOne({ _id: new ObjectId(bookingId) });

    if (!record) return res.json({ success: false, message: "预约不存在" });
    if (record.studentUsername !== studentUsername)
      return res.json({ success: false, message: "无权取消此预约" });

    await db.collection("appointments").deleteOne({ _id: new ObjectId(bookingId) });

    res.json({ success: true });

  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

module.exports = router;
