const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action, teacherId, slots } = event;

  console.log('===== 云函数被调用 =====');
  console.log('Action:', action);
  console.log('TeacherId:', teacherId);
  console.log('Slots:', slots);

  try {

    // ========== 保存/更新教师空闲时间 ========== //
    if (action === 'save') {
      if (!teacherId) {
        return { code: 400, message: '缺少教师 ID' };
      }

      const newSlots = Array.isArray(slots) ? slots : [];

      const scheduleRes = await db.collection('schedules').where({ teacherId }).get();

      if (scheduleRes.data.length > 0) {
        const id = scheduleRes.data[0]._id;
        await db.collection('schedules').doc(id).update({
          data: {
            slots: newSlots,
            updateTime: db.serverDate()
          }
        });
      } else {
        await db.collection('schedules').add({
          data: {
            teacherId,
            slots: newSlots,
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        });
      }

      await cancelInvalidAppointments(teacherId, newSlots);

      return { code: 200, message: '保存成功' };
    }

    // ========== 获取教师空闲时间 ========== //
    if (action === 'get') {
      if (!teacherId) {
        return { code: 400, message: '缺少教师 ID' };
      }

      const result = await db.collection('schedules')
        .where({ teacherId })
        .limit(1)
        .get();

      return { 
        code: 200, 
        data: { slots: result.data.length ? result.data[0].slots : [] } 
      };
    }

    // ========== 获取全部教师空闲时间 ========== //
    if (action === 'getAll') {
      const result = await db.collection('schedules').get();
      return {
        success: true,
        data: result.data || []
      };
    }

    return { code: 400, message: '未知操作类型' };

  } catch (err) {
    console.error('💥 云函数执行失败:', err);
    return { code: 500, message: err.message };
  }
};

// ========== 自动取消冲突预约 ========== //
async function cancelInvalidAppointments(teacherId, validSlots) {
  console.log('>>> 自动取消无效预约逻辑启动');

  if (!Array.isArray(validSlots)) validSlots = [];

  const bookingRes = await db.collection('appointments')
    .where({ teacherId })
    .limit(100)
    .get();

  if (!bookingRes.data?.length) return;

  const validSet = new Set(validSlots.map(v => `${v.day}-${v.slot}`));

  const toRemove = bookingRes.data.filter(b => (
    !validSet.has(`${b.day}-${b.slot}`)
  ));

  if (!toRemove.length) return;

  await db.collection('appointments')
    .where({ _id: _.in(toRemove.map(b => b._id)) })
    .remove();

  console.log('已取消无效预约');
}
