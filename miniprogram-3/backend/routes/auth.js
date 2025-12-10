const express = require("express");
const router = express.Router();
const { connectDB } = require("../utils/db");

router.post("/login", async (req, res) => {
  try {
    await connectDB();
    const mongoose = require("mongoose");
    const User = mongoose.model("User");

    const { username, password, role } = req.body;

    const user = await User.findOne({ username, password, role });

    if (!user) {
      return res.json({ success: false, message: "用户名或密码错误" });
    }

    res.json({
      success: true,
      data: { username: user.username, role: user.role, name: user.name }
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

module.exports = router;
