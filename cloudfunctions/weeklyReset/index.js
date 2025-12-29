const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// true = 清空 schedules.slots；false = 不清空 slots，只清空 appointments
const CLEAR_SCHEDULE_SLOTS = true;

function getWeekKeyByFridayCutoff(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0(日)~6(六)
  const diffToFriday = (5 - day + 7) % 7;
  d.setDate(d.getDate() + diffToFriday);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

async function clearAppointments() {
  const BATCH = 20;
  let total = 0;

  while (true) {
    const batch = await db.collection('appointments').limit(BATCH).get();
    if (!batch.data || batch.data.length === 0) break;

    await Promise.all(
      batch.data.map(doc => db.collection('appointments').doc(doc._id).remove())
    );

    total += batch.data.length;
    console.log(`🧹 cleared appointments batch=${batch.data.length}, total=${total}`);
  }

  return total;
}

async function clearScheduleSlots() {
  const BATCH = 20;
  let totalUpdated = 0;

  while (true) {
    const batch = await db.collection('schedules').limit(BATCH).get();
    if (!batch.data || batch.data.length === 0) break;

    await Promise.all(
      batch.data.map(doc =>
        db.collection('schedules').doc(doc._id).update({
          data: { slots: [] }
        })
      )
    );

    totalUpdated += batch.data.length;
    console.log(`🧽 cleared schedules.slots batch=${batch.data.length}, total=${totalUpdated}`);

    const check = await db.collection('schedules')
      .where({ slots: db.command.neq([]) })
      .limit(1)
      .get();
    if (!check.data || check.data.length === 0) break;
  }

  return totalUpdated;
}

exports.main = async () => {
  const now = new Date();
  const weekKey = getWeekKeyByFridayCutoff(now);

  try {
    // 1) 读取预约
    const apptRes = await db.collection('appointments').get();
    const appointments = apptRes.data || [];

    // 2) 只导出：学号 + 时间
    const exportRows = appointments
      .map(a => ({
        studentNo: a.studentNo || null,
        time: `day-${a.day}-slot-${a.slot}`
      }))
      .filter(x => !!x.studentNo);

    // 3) 写入归档日志（只写这一条）
    await db.collection('appointment_logs').add({
      data: {
        weekKey,
        archivedAt: now,
        total: exportRows.length,
        rows: exportRows,
        meta: { trigger: 'manual_or_cron', version: 4, export: 'studentNo+time' }
      }
    });

    // 4) 清空预约
    const clearedAppointments = await clearAppointments();

    // 5) 可选清空 schedules.slots
    let clearedSchedules = 0;
    if (CLEAR_SCHEDULE_SLOTS) {
      clearedSchedules = await clearScheduleSlots();
    }

    return {
      success: true,
      weekKey,
      message: 'Weekly reset done',
      clearedAppointments,
      clearedSchedules,
      clearedScheduleSlots: CLEAR_SCHEDULE_SLOTS
    };
  } catch (err) {
    console.error('weeklyReset failed:', err);
    return { success: false, message: err.message, weekKey };
  }
}; //
