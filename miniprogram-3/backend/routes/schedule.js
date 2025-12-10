// backend/routes/schedule.js
const express = require("express");
const router = express.Router();
const { getDb } = require("../utils/db");

// ========== 获取所有教师的可预约时间 ==========
router.get("/getAll", async (req, res) => {
  try {
    const { db } = await getDb();
    const rows = await db.collection("schedules").find().toArray();
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: err.message });
  }
});

// ========== 获取某个教师的时间表 ==========
router.get("/get", async (req, res) => {
  try {
    const teacherId = req.query.teacherId;
    const { db } = await getDb();

    const row = await db.collection("schedules").findOne({ teacherId });
    return res.json({ success: true, data: row || null });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: err.message });
  }
});

// ========== 保存某教师的空闲时间（小程序用） ==========
router.post("/save", async (req, res) => {
  try {
    const { teacherId, slots } = req.body;

    if (!teacherId || !Array.isArray(slots)) {
      return res.json({ code: 400, message: "teacherId 或 slots 缺失" });
    }

    const { db } = await getDb();

    // 查看是否已存在记录
    const existing = await db.collection("schedules").findOne({ teacherId });

    if (existing) {
      // 更新
      await db
        .collection("schedules")
        .updateOne({ teacherId }, { $set: { slots, updateTime: new Date() } });
    } else {
      // 插入
      await db.collection("schedules").insertOne({
        teacherId,
        slots,
        createTime: new Date(),
        updateTime: new Date(),
      });
    }

    return res.json({ code: 200, message: "保存成功" });
  } catch (err) {
    console.error(err);
    return res.json({ code: 500, message: err.message });
  }
});

module.exports = router;
