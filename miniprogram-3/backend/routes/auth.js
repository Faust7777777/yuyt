// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { getDb } = require('../utils/db');

// simple login to emulate your previous login behavior
router.post('/login', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const { db } = await getDb();
    const user = await db.collection('users').findOne({ username, password, role });
    if (!user) return res.json({ success: false, message: '用户名或密码错误' });
    // return user info similar to previous cloud function
    return res.json({ success: true, data: { username: user.username, role: user.role, name: user.name } });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: err.message });
  }
});

module.exports = router;
