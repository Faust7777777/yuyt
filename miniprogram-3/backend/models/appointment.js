// backend/appointment.js
const { connectToDatabase } = require("./utils");

module.exports = async (req, res) => {
  const { action } = req.query;
  const { db } = await connectToDatabase();

  try {
    if (action === "getAll") {
      const data = await db.collection("appointments").find().toArray();
      return res.json({ success: true, data });
    }

    if (action === "book") {
      const { teacherId, teacherName, day, slot, studentName, studentUsername } = req.body;

      const conflict = await db.collection("appointments").findOne({ teacherId, day, slot });
      if (conflict) return res.json({ success: false, message: "该教师该时间段已被预约" });

      const schedule = await db.collection("schedules").findOne({ teacherId });
      const valid = schedule?.slots?.some(s => s.day === day && s.slot === slot);
      if (!valid) return res.json({ success: false, message: "该教师该时间段不可预约" });

      await db.collection("appointments").insertOne({
        teacherId, teacherName, day, slot, studentName, studentUsername,
        bookingTime: new Date()
      });

      return res.json({ success: true });
    }

    if (action === "getByStudent") {
      const { studentUsername } = req.query;
      const data = await db.collection("appointments").find({ studentUsername }).toArray();
      return res.json({ success: true, data });
    }

    if (action === "getByTeacher") {
      const { teacherId } = req.query;
      const data = await db.collection("appointments").find({ teacherId }).toArray();
      return res.json({ success: true, data });
    }

    if (action === "cancel") {
      const { bookingId, studentUsername } = req.body;
      const record = await db.collection("appointments").findOne({ _id: bookingId });

      if (!record) return res.json({ success: false, message: "预约不存在" });
      if (record.studentUsername !== studentUsername) return res.json({ success: false, message: "无权取消此预约" });

      await db.collection("appointments").deleteOne({ _id: bookingId });
      return res.json({ success: true });
    }

    res.json({ success: false, message: "未知操作" });

  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};
