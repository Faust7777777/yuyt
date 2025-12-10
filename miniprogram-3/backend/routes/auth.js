const express = require("express");
const router = express.Router();
const { getDb } = require("../utils/db");

router.post("/login", async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const { db } = await getDb();

    const user = await db.collection("users").findOne({ username, password, role });

    if (!user) {
      return res.json({ success: false, message: "用户名或密码错误" });
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
