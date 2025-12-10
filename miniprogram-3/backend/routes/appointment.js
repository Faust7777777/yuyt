// backend/routes/appointment.js
const express = require("express");
const router = express.Router();
const { getDb } = require("../utils/db");
const { ObjectId } = require("mongodb");

// ========== 学生获取预约 ==========
router.get("/getByStudent", async (req, res) => {
  try {
    const studentUsername = req.query.studentUsername;
    const { db } = await getDb();

    const data = await db
      .collection("appointments")
      .find({ studentUsername })
      .toArray();

    return res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: err.message });
  }
});

// ========== 教师获取预约 ==========
router.get("/getByTeacher", async (req, res) => {
  try {
    const teacherId = req.query.teacherId;
    const { db } = await getDb();

    const data = await db
      .collection("appointments")
      .find({ teacherId })
      .toArray();

    return res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: err.message });
  }
});

// ========== 所有预约（学生可用） ==========
router.get("/getAll", async (req, res) => {
  try {
    const { db } = await getDb();
    const data = await db.collection("appointments").find().toArray();

    return res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: err.message });
  }
});

// ========== 学生预约 ==========
router.post("/book", async (req, res) => {
  try {
    const { db } = await getDb();
    const { teacherId, teacherName, day, slot, studentName, studentUsername } =
      req.body;

    if (!teacherId || day === undefined || slot === undefined) {
      return res.json({ success: false, message: "参数不完整" });
    }

    // 冲突检查
    const conflict = await db
      .collection("appointments")
      .findOne({ teacherId, day, slot });

    if (conflict)
      return res.json({ success: false, message: "该时间段已被预约" });

    // 验证教师是否开放该时间段
    const schedule = await db.collection("schedules").findOne({ teacherId });
    const valid =
      schedule &&
      Array.isArray(schedule.slots) &&
      schedule.slots.some((s) => s.day === day && s.slot === slot);

    if (!valid)
      return res.json({ success: false, message: "该时间段不可预约" });

    // 插入预约
    const result = await db.collection("appointments").insertOne({
      teacherId,
      teacherName,
      day,
      slot,
      studentName,
      studentUsername,
      bookingTime: new Date(),
    });

    return res.json({ success: true, data: { insertedId: result.insertedId } });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: err.message });
  }
});

// ========== 学生取消预约 ==========
router.post("/cancel", async (req, res) => {
  try {
    const { db } = await getDb();
    const { bookingId, studentUsername } = req.body;

    if (!bookingId)
      return res.json({ success: false, message: "bookingId 缺失" });

    let _id;
    try {
      _id = new ObjectId(bookingId);
    } catch {
      return res.json({ success: false, message: "bookingId 无效" });
    }

    const record = await db.collection("appointments").findOne({ _id });
    if (!record)
      return res.json({ success: false, message: "预约记录不存在" });

    if (record.studentUsername !== studentUsername)
      return res.json({ success: false, message: "无权取消此预约" });

    await db.collection("appointments").deleteOne({ _id });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: err.message });
  }
});

module.exports = router;
