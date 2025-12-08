// backend/routes/schedule.js
const express = require('express');
const router = express.Router();
const { getDb } = require('../utils/db');

router.get('/', async (req, res) => {
  const action = req.query.action;
  try {
    const { db } = await getDb();
    if (action === 'getAll') {
      const rows = await db.collection('schedules').find().toArray();
      return res.json({ success: true, data: rows });
    }
    if (action === 'get') {
      const teacherId = req.query.teacherId;
      const row = await db.collection('schedules').findOne({ teacherId });
      return res.json({ success: true, data: row || null });
    }
    return res.json({ success: false, message: 'unknown action' });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  // POST /api/schedule?action=save
  const action = req.query.action;
  try {
    const { db } = await getDb();
    if (action === 'save') {
      const { teacherId, slots } = req.body;
      if (!teacherId) return res.json({ success: false, message: 'teacherId required' });

      const newSlots = Array.isArray(slots) ? slots : [];
      const existing = await db.collection('schedules').findOne({ teacherId });
      if (existing) {
        await db.collection('schedules').updateOne({ teacherId }, { $set: { slots: newSlots, updateTime: new Date() } });
      } else {
        await db.collection('schedules').insertOne({ teacherId, slots: newSlots, createTime: new Date(), updateTime: new Date() });
      }

      // optional: could cancel invalid appointments here (we provide admin route)
      return res.json({ success: true });
    }
    return res.json({ success: false, message: 'unknown action' });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: err.message });
  }
});

module.exports = router;
