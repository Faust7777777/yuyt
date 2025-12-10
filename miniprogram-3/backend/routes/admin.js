// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const { getDb } = require('../utils/db');

router.post('/weekly-reset', async (req, res) => {
  try {
    const { db } = await getDb();
    const bookings = await db.collection('appointments').find().toArray();
    if (bookings.length > 0) {
      await db.collection('appointment_logs').insertOne({
        weekEndTime: new Date(),
        logs: bookings
      });
    }

    // delete in batches
    while (true) {
      const chunk = await db.collection('appointments').find().limit(50).toArray();
      if (!chunk.length) break;
      const ids = chunk.map(d => d._id);
      await db.collection('appointments').deleteMany({ _id: { $in: ids } });
    }

    return res.json({ success: true, message: 'weekly reset done', count: bookings.length });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: err.message });
  }
});

module.exports = router;
