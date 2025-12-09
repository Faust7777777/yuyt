const express = require('express');
const router = express.Router();
const { getDb } = require('../utils/db');

// 获取全部教师空闲时间
router.get('/getAll', async (req, res) => {
  try {
    const { db } = await getDb();
    const data = await db.collection('schedules').find().toArray();
    res.json({ code: 200, data: { slots: data } });
  } catch (err) {
    res.json({ code: 500, message: err.message });
  }
});

// 获取指定教师
router.get('/get', async (req, res) => {
  const { teacherId } = req.query;
  if (!teacherId)
    return res.json({ code: 400, message: '缺少教师ID' });

  try {
    const { db } = await getDb();
    const result = await db.collection('schedules').findOne({ teacherId });
    res.json({ code: 200, data: { slots: result?.slots || [] } });
  } catch (err) {
    res.json({ code: 500, message: err.message });
  }
});

module.exports = router;
