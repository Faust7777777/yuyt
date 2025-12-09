const express = require('express');
const router = express.Router();
const { getDb } = require('../utils/db');
const { ObjectId } = require('mongodb');

// 学生预约
router.post('/book', async (req, res) => {
  const { teacherId, teacherName, day, slot, studentName, studentUsername } = req.body;

  if (!teacherId || day === undefined || slot === undefined || !studentUsername) {
    return res.json({ code: 400, message: '参数不完整' });
  }

  try {
    const { db } = await getDb();

    // 防冲突
    const conflict = await db.collection('appointments')
      .findOne({ teacherId, day, slot });
    if (conflict)
      return res.json({ code: 400, message: '该教师该时间段已被预约' });

    await db.collection('appointments').insertOne({
      teacherId, teacherName, day, slot,
      studentName, studentUsername,
      bookingTime: new Date()
    });

    res.json({ code: 200 });
  } catch (err) {
    res.json({ code: 500, message: err.message });
  }
});

// 学生查看预约
router.get('/getByStudent', async (req, res) => {
  const { studentUsername } = req.query;
  try {
    const { db } = await getDb();
    const data = await db.collection('appointments')
      .find({ studentUsername }).toArray();
    res.json({ code: 200, data: { bookings: data } });
  } catch (err) {
    res.json({ code: 500, message: err.message });
  }
});

// 学生取消预约
router.post('/cancel', async (req, res) => {
  const { bookingId, studentUsername } = req.body;
  try {
    const { db } = await getDb();

    const result = await db.collection('appointments').deleteOne({
      _id: new ObjectId(bookingId),
      studentUsername
    });

    if (result.deletedCount === 0)
      return res.json({ code: 400, message: '取消失败' });

    res.json({ code: 200 });
  } catch (err) {
    res.json({ code: 500, message: err.message });
  }
});

module.exports = router;
