const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// 用户模型
const User = mongoose.model('User', new mongoose.Schema({
  username: String,
  password: String,
  role: String,
  name: String,
}));

router.post('/login', async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const user = await User.findOne({ username, password, role });

    if (!user) {
      return res.json({ success: false, message: '用户名或密码错误' });
    }

    return res.json({
      success: true,
      data: {
        username: user.username,
        role: user.role,
        name: user.name
      }
    });

  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: err.message });
  }
});

module.exports = router;
