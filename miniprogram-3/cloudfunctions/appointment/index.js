const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { action } = event;

  try {

    // ========== 获取全部预约记录 ==========
    if (action === 'getAll') {
      const res = await db.collection('appointments').get();
      return {
        success: true,
        data: res.data || []
      };
    }

    // ========== 创建预约（学生） ==========
    if (action === 'book') {
      const { teacherId, teacherName, day, slot, studentName, studentUsername } = event;

      console.log(`📌 校验预约: teacher=${teacherId} day=${day} slot=${slot}`);

      // 先查是否冲突
      const existRes = await db.collection('appointments')
        .where({ teacherId, day, slot })
        .get();

      if (existRes.data.length > 0) {
        return { success: false, message: '该教师该时间段已被预约' };
      }

      // 查教师 schedule 是否包含此 slot
      const scheduleRes = await db.collection('schedules')
        .where({ teacherId })
        .limit(1)
        .get();

      if (scheduleRes.data.length === 0) {
        return { success: false, message: '教师未设置时间表' };
      }

      // 🔥 正确字段：slots
      const teacherSlots = scheduleRes.data[0].slots || [];
      console.log('教师 slots:', teacherSlots);

      const slotExists = teacherSlots.some(
        s => s.day === day && s.slot === slot
      );

      if (!slotExists) {
        return { success: false, message: '该教师该时间段不可预约' };
      }

      // 创建预约记录
      await db.collection('appointments').add({
        data: {
          teacherId,
          teacherName,
          day,
          slot,
          studentName,
          studentUsername,
          bookingTime: db.serverDate()
        }
      });

      return { success: true };
    }


    // ========== 学生获取自己的预约 ==========
    if (action === 'getByStudent') {
      const { studentUsername } = event;
      const res = await db.collection('appointments')
        .where({ studentUsername })
        .get();

      return {
        success: true,
        data: res.data || []
      };
    }


    // ========== 教师获取预约 ==========
    if (action === 'getByTeacher') {
      const { teacherId } = event;
      const res = await db.collection('appointments')
        .where({ teacherId })
        .get();

      return {
        success: true,
        data: res.data || []
      };
    }


    // ========== 学生取消预约 ==========
    if (action === 'cancel') {
      const { bookingId, studentUsername } = event;

      const booking = await db.collection('appointments')
        .doc(bookingId)
        .get();

      if (!booking.data) {
        return { success: false, message: '预约不存在' };
      }

      if (booking.data.studentUsername !== studentUsername) {
        return { success: false, message: '无权取消此预约' };
      }

      await db.collection('appointments')
        .doc(bookingId)
        .remove();

      return { success: true };
    }

    return { success: false, message: '未知操作类型' };

  } catch (err) {
    console.error('💥 Appointment 云函数执行失败:', err);
    return { success: false, message: err.message };
  }
};
