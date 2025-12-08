// backend/routes/appointment.js
const express = require('express');
const router = express.Router();
const { getDb } = require('../utils/db');

router.get('/', async (req, res) => {
  // GET /api/appointment?action=getAll|getByStudent|getByTeacher
  const action = req.query.action;
  try {
    const { db } = await getDb();
    if (action === 'getAll') {
      const data = await db.collection('appointments').find().toArray();
      return res.json({ success: true, data });
    }
    if (action === 'getByStudent') {
      const studentUsername = req.query.studentUsername;
      const data = await db.collection('appointments').find({ studentUsername }).toArray();
      return res.json({ success: true, data });
    }
    if (action === 'getByTeacher') {
      const teacherId = req.query.teacherId;
      const data = await db.collection('appointments').find({ teacherId }).toArray();
      return res.json({ success: true, data });
    }
    return res.json({ success: false, message: 'unknown action' });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  // POST /api/appointment?action=book|cancel
  const action = req.query.action;
  try {
    const { db, ObjectId } = await getDb();

    if (action === 'book') {
      const { teacherId, teacherName, day, slot, studentName, studentUsername } = req.body;

      if (!teacherId || day === undefined || slot === undefined || !studentUsername) {
        return res.json({ success: false, message: '参数不完整' });
      }

      // conflict check
      const conflict = await db.collection('appointments').findOne({ teacherId, day, slot });
      if (conflict) return res.json({ success: false, message: '该教师该时间段已被预约' });

      // teacher slots check
      const schedule = await db.collection('schedules').findOne({ teacherId });
      const valid = schedule && Array.isArray(schedule.slots) && schedule.slots.some(s => s.day === day && s.slot === slot);
      if (!valid) return res.json({ success: false, message: '该教师该时间段不可预约' });

      const result = await db.collection('appointments').insertOne({
        teacherId, teacherName, day, slot, studentName, studentUsername, bookingTime: new Date()
      });

      return res.json({ success: true, data: { insertedId: result.insertedId } });
    }

    if (action === 'cancel') {
      const { bookingId, studentUsername } = req.body;
      if (!bookingId) return res.json({ success: false, message: 'bookingId required' });

      let _id;
      try { _id = new ObjectId(bookingId); } catch (e) { return res.json({ success: false, message: 'bookingId invalid' }); }

      const record = await db.collection('appointments').findOne({ _id });
      if (!record) return res.json({ success: false, message: '预约不存在' });
      if (record.studentUsername !== studentUsername) return res.json({ success: false, message: '无权取消此预约' });

      await db.collection('appointments').deleteOne({ _id });
      return res.json({ success: true });
    }

    return res.json({ success: false, message: 'unknown action' });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: err.message });
  }
});

module.exports = router;
