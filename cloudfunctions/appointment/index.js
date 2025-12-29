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
      const {
        teacherId,
        teacherName,
        day,
        slot,

        // 新字段（推荐）
        studentId,
        studentNo,
        studentPhone,

        // 旧字段（兼容）
        studentName,
        studentUsername
      } = event;

      console.log(`📌 校验预约: teacher=${teacherId} day=${day} slot=${slot}`);

      // 1) 冲突检查：同一教师同一时间段只能被预约一次
      const existRes = await db.collection('appointments')
        .where({ teacherId, day, slot })
        .get();

      if (existRes.data.length > 0) {
        return { success: false, message: '该教师该时间段已被预约' };
      }

      // 2) 查教师 schedule 是否包含此 slot
      const scheduleRes = await db.collection('schedules')
        .where({ teacherId })
        .limit(1)
        .get();

      if (scheduleRes.data.length === 0) {
        return { success: false, message: '教师未设置时间表' };
      }

      const teacherSlots = scheduleRes.data[0].slots || [];
      const slotExists = teacherSlots.some(s => s.day === day && s.slot === slot);

      if (!slotExists) {
        return { success: false, message: '该教师该时间段不可预约' };
      }

      // 3) 写预约记录：保存 studentId + 学号 + 手机号（如果有）
      await db.collection('appointments').add({
        data: {
          teacherId,
          teacherName,
          day,
          slot,

          // ✅ 新字段（以后你导出就更清晰）
          studentId: studentId || null,
          studentNo: studentNo || null,
          studentPhone: studentPhone || null,

          // ✅ 旧字段（兼容旧页面显示/旧查询）
          studentName: studentName || studentNo || '学生',
          studentUsername: studentUsername || studentId || studentNo || 'unknown',

          bookingTime: db.serverDate()
        }
      });

      return { success: true };
    }

    // ========== 学生获取自己的预约 ==========
    if (action === 'getByStudent') {
      const { studentId, studentUsername } = event;

      // ✅ 优先用 studentId（新逻辑最准）
      if (studentId) {
        const res = await db.collection('appointments')
          .where({ studentId })
          .get();

        return {
          success: true,
          data: res.data || []
        };
      }

      // ✅ 兼容旧逻辑：用 studentUsername
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
      const { bookingId, studentId, studentUsername } = event;

      const booking = await db.collection('appointments')
        .doc(bookingId)
        .get();

      if (!booking.data) {
        return { success: false, message: '预约不存在' };
      }

      // ✅ 优先按 studentId 校验（更安全）
      if (booking.data.studentId && studentId) {
        if (booking.data.studentId !== studentId) {
          return { success: false, message: '无权取消此预约' };
        }
      } else {
        // ✅ 兼容旧逻辑
        if (booking.data.studentUsername !== studentUsername) {
          return { success: false, message: '无权取消此预约' };
        }
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
