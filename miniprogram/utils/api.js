/**
 * 云开发版 API - 支持多教师系统
 * 所有数据存储在云数据库中
 */

const config = require('./config.js');
const cloud = wx.cloud;

// ==================== 辅助函数 ====================
const generateId = () => {
  return Date.now() + Math.random().toString(36).substr(2, 9);
};

// ==================== API 函数 ====================

/**
 * 教师/旧版用户登录（账号密码）
 * ✅ 保持不变：仍调用云函数 login
 */
const login = async (username, password, role) => {
  try {
    const res = await cloud.callFunction({
      name: 'login',
      data: { username, password, role }
    });

    if (res.result.success) {
      // 保存用户信息到本地缓存
      const currentUser = {
        id: res.result.data.username,
        username: res.result.data.username,
        role: res.result.data.role,
        name: res.result.data.name,
        token: generateId()
      };
      wx.setStorageSync('appointment_current_user', currentUser);

      return {
        code: 200,
        message: '登录成功',
        data: {
          token: currentUser.token,
          user: currentUser
        }
      };
    } else {
      return {
        code: 401,
        message: res.result.message || '登录失败'
      };
    }
  } catch (err) {
    console.error('登录失败:', err);
    return {
      code: 500,
      message: '网络错误,请稍后重试'
    };
  }
};

/**
 * ✅ 新增：学生登录（学号 + 手机号，无密码）
 * 调用云函数 studentLogin
 * 登录成功后同样写入 appointment_current_user，供后续预约/查询/取消使用
 */
const studentLogin = async (studentNo, studentPhone) => {
  try {
    const res = await cloud.callFunction({
      name: 'studentLogin',
      data: { studentNo, studentPhone }
    });

    if (res.result && res.result.success) {
      const studentId = res.result.studentId;

      // 统一缓存结构：让旧代码里 currentUser.username 也能工作
      const currentUser = {
        id: studentId,                 // ✅ 学生唯一 ID
        username: studentId,           // ✅ 兼容旧逻辑：把 username 当 studentId 用
        role: 'student',
        name: studentNo,               // 你现有 UI 里用 name 展示，这里先用学号（也可改成你想展示的）
        studentNo,
        studentPhone,
        token: generateId()
      };

      wx.setStorageSync('appointment_current_user', currentUser);

      return {
        code: 200,
        message: '登录成功',
        data: {
          token: currentUser.token,
          user: currentUser
        },
        studentId
      };
    } else {
      return {
        code: 401,
        message: res.result?.message || '登录失败'
      };
    }
  } catch (err) {
    console.error('学生登录失败:', err);
    return {
      code: 500,
      message: '网络错误,请稍后重试'
    };
  }
};

/**
 * 教师保存空闲时间（包含自动取消预约逻辑）
 * ✅ 不变
 */
const saveSchedule = async (slots) => {
  const currentUser = wx.getStorageSync('appointment_current_user');

  if (!currentUser || currentUser.role !== 'teacher') {
    return {
      code: 403,
      message: '无权限操作'
    };
  }

  try {
    console.log('📤 API 调用 - saveSchedule');
    console.log('  教师 ID:', currentUser.username);
    console.log('  时间段数量:', slots.length);

    const res = await cloud.callFunction({
      name: 'schedule',
      data: {
        action: 'save',
        teacherId: currentUser.username,
        slots
      }
    });

    console.log('✅ 云函数返回:', res.result);

    if (res.result.code === 200) {
      return {
        code: 200,
        message: '保存成功'
      };
    } else {
      return {
        code: 400,
        message: res.result.message || '保存失败'
      };
    }
  } catch (err) {
    console.error('❌ saveSchedule 失败:', err);
    return {
      code: 500,
      message: '保存失败'
    };
  }
};

/**
 * 获取教师已设置的空闲时间
 * ✅ 不变
 */
const getTeacherSchedule = async () => {
  const currentUser = wx.getStorageSync('appointment_current_user');

  if (!currentUser || currentUser.role !== 'teacher') {
    return {
      code: 403,
      message: '无权限操作'
    };
  }

  try {
    console.log('📥 API 调用 - getTeacherSchedule');
    console.log('  教师 ID:', currentUser.username);

    const res = await cloud.callFunction({
      name: 'schedule',
      data: {
        action: 'get',
        teacherId: currentUser.username
      }
    });

    console.log('✅ 云函数返回:', res.result);

    if (res.result.code === 200) {
      return {
        code: 200,
        data: {
          schedule: res.result.data?.slots || []
        }
      };
    } else {
      return {
        code: 400,
        message: res.result.message || '获取失败'
      };
    }
  } catch (err) {
    console.error('❌ getTeacherSchedule 失败:', err);
    return {
      code: 500,
      message: '获取失败'
    };
  }
};

/**
 * 学生获取可预约时间
 * ✅ 不变
 */
const getAvailableSlots = async () => {
  const currentUser = wx.getStorageSync('appointment_current_user');

  if (!currentUser || currentUser.role !== 'student') {
    return {
      code: 403,
      message: '无权限操作'
    };
  }

  try {
    const scheduleRes = await cloud.callFunction({
      name: 'schedule',
      data: { action: 'getAll' }
    });

    const appointmentRes = await cloud.callFunction({
      name: 'appointment',
      data: { action: 'getAll' }
    });

    if (!scheduleRes.result.success || !appointmentRes.result.success) {
      return {
        code: 400,
        message: '获取数据失败'
      };
    }

    const allSchedules = scheduleRes.result.data || [];
    const allBookings = appointmentRes.result.data || [];

    const slotMap = {};

    allSchedules.forEach(teacherSchedule => {
      const teacherId = teacherSchedule.teacherId;
      const slots = teacherSchedule.slots || [];

      slots.forEach(slot => {
        const key = `${slot.day}-${slot.slot}`;

        if (!slotMap[key]) {
          slotMap[key] = {
            day: slot.day,
            slot: slot.slot,
            teachers: [],
            bookings: []
          };
        }

        slotMap[key].teachers.push(teacherId);
      });
    });

    allBookings.forEach(booking => {
      const key = `${booking.day}-${booking.slot}`;
      if (slotMap[key]) {
        slotMap[key].bookings.push(booking);
      }
    });

    const availableSlots = Object.values(slotMap).map(slot => {
      const availableTeachers = slot.teachers.filter(teacherId => {
        return !slot.bookings.some(b => b.teacherId === teacherId);
      });

      const allBooked = availableTeachers.length === 0;

      return {
        id: `${slot.day}-${slot.slot}`,
        day: slot.day,
        slot: slot.slot,
        booked: allBooked,
        teacherCount: slot.teachers.length,
        bookedCount: slot.bookings.length,
        availableTeachers: availableTeachers.map(teacherId => ({
          id: teacherId,
          name: config.getTeacherInfo(teacherId).name
        }))
      };
    });

    return {
      code: 200,
      data: { slots: availableSlots }
    };
  } catch (err) {
    console.error('获取失败:', err);
    return {
      code: 500,
      message: '获取失败'
    };
  }
};

/**
 * 学生预约时间段
 * ✅ 改动：把 studentId/studentNo/studentPhone 一起传给后端（同时保留旧字段兼容）
 */
const bookSlot = async (slotId, teacherId) => {
  const currentUser = wx.getStorageSync('appointment_current_user');

  if (!currentUser || currentUser.role !== 'student') {
    return {
      code: 403,
      message: '无权限操作'
    };
  }

  if (!teacherId) {
    return {
      code: 400,
      message: '请选择教师'
    };
  }

  const [day, slot] = slotId.split('-').map(Number);
  const teacherInfo = config.getTeacherInfo(teacherId);

  try {
    const res = await cloud.callFunction({
      name: 'appointment',
      data: {
        action: 'book',
        teacherId,
        teacherName: teacherInfo ? teacherInfo.name : '未知教师',
        day,
        slot,

        // ✅ 新字段（推荐）
        studentId: currentUser.id,
        studentNo: currentUser.studentNo,
        studentPhone: currentUser.studentPhone,

        // ✅ 旧字段（兼容你现有云函数）
        studentName: currentUser.name,
        studentUsername: currentUser.username
      }
    });

    if (res.result.success) {
      return {
        code: 200,
        message: '预约成功'
      };
    } else {
      return {
        code: 400,
        message: res.result.message || '预约失败'
      };
    }
  } catch (err) {
    console.error('预约失败:', err);
    return {
      code: 500,
      message: '预约失败'
    };
  }
};

/**
 * 学生获取自己的预约记录
 * ✅ 兼容：仍传 studentUsername（现在它是 studentId），并额外传 studentId（你后端改了也能用）
 */
const getMyBookings = async () => {
  const currentUser = wx.getStorageSync('appointment_current_user');

  if (!currentUser || currentUser.role !== 'student') {
    return {
      code: 403,
      message: '无权限操作'
    };
  }

  try {
    const res = await cloud.callFunction({
      name: 'appointment',
      data: {
        action: 'getByStudent',
        studentId: currentUser.id,
        studentUsername: currentUser.username
      }
    });

    if (res.result.success) {
      return {
        code: 200,
        data: { bookings: res.result.data || [] }
      };
    } else {
      return {
        code: 400,
        message: res.result.message || '获取失败'
      };
    }
  } catch (err) {
    console.error('获取失败:', err);
    return {
      code: 500,
      message: '获取失败'
    };
  }
};

/**
 * 学生取消预约
 * ✅ 兼容：仍传 studentUsername（现在它是 studentId），并额外传 studentId
 */
const cancelBooking = async (bookingId) => {
  const currentUser = wx.getStorageSync('appointment_current_user');

  if (!currentUser || currentUser.role !== 'student') {
    return {
      code: 403,
      message: '无权限操作'
    };
  }

  try {
    const res = await cloud.callFunction({
      name: 'appointment',
      data: {
        action: 'cancel',
        bookingId,
        studentId: currentUser.id,
        studentUsername: currentUser.username
      }
    });

    if (res.result.success) {
      return {
        code: 200,
        message: '取消预约成功'
      };
    } else {
      return {
        code: 400,
        message: res.result.message || '取消失败'
      };
    }
  } catch (err) {
    console.error('取消失败:', err);
    return {
      code: 500,
      message: '取消失败'
    };
  }
};

/**
 * 教师查看预约记录
 * ✅ 不变
 */
const getTeacherAppointments = async () => {
  const currentUser = wx.getStorageSync('appointment_current_user');

  if (!currentUser || currentUser.role !== 'teacher') {
    return {
      code: 403,
      message: '无权限操作'
    };
  }

  try {
    const res = await cloud.callFunction({
      name: 'appointment',
      data: {
        action: 'getByTeacher',
        teacherId: currentUser.username
      }
    });

    if (res.result.success) {
      return {
        code: 200,
        data: { appointments: res.result.data || [] }
      };
    } else {
      return {
        code: 400,
        message: res.result.message || '获取失败'
      };
    }
  } catch (err) {
    console.error('获取失败:', err);
    return {
      code: 500,
      message: '获取失败'
    };
  }
};

/**
 * 清空所有数据(仅用于测试)
 */
const clearAllData = () => {
  console.log('云开发版本不支持清空数据,请在云控制台操作');
};

// ==================== 导出 API ====================
module.exports = {
  login,
  studentLogin, // ✅ 新增
  saveSchedule,
  getTeacherSchedule,
  getAvailableSlots,
  bookSlot,
  getMyBookings,
  cancelBooking,
  getTeacherAppointments,
  clearAllData
};
