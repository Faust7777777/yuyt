const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async () => {
  console.log("🔥 Weekly Reset Triggered!");

  try {
    // 1️⃣ 查询全部预约
    const res = await db.collection('appointments').get();
    const bookings = res.data || [];

    if (bookings.length > 0) {
      console.log(`📦 本周有 ${bookings.length} 条预约，准备备份...`);

      // 2️⃣ 写入日志集合
      await db.collection('appointment_logs').add({
        data: {
          weekEndTime: db.serverDate(),
          logs: bookings
        }
      });

      console.log('📑 已成功写入日志');
    } else {
      console.log('📭 本周无预约，无需备份');
    }

    // 3️⃣ 清空预约数据
    await clearAllAppointments();

    console.log('🧹 已成功清空本周预约');

    return {
      success: true,
      message: "定时清理完成"
    };

  } catch (err) {
    console.error('❌ Weekly Reset Error:', err);
    return { success: false, message: err.message };
  }
};

// 批量删除函数
async function clearAllAppointments() {
  const batchLimit = 20;
  let done = false;

  while (!done) {
    const res = await db.collection('appointments').limit(batchLimit).get();
    if (res.data.length === 0) {
      done = true;
      break;
    }

    const ids = res.data.map(item => item._id);
    await db.collection('appointments')
      .where({ _id: db.command.in(ids) })
      .remove();

    await new Promise(r => setTimeout(r, 200));
  }
}
