const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { studentNo, studentPhone } = event;

  if (!studentNo || !studentPhone) {
    return { success: false, message: '缺少学号或手机号' };
  }

  // 手机号基础校验
  if (!/^\d{11}$/.test(studentPhone)) {
    return { success: false, message: '手机号格式不正确' };
  }

  const { OPENID } = cloud.getWXContext();
  const now = new Date();

  // 学号+手机号 唯一确定学生
  const exist = await db.collection('students')
    .where({ studentNo, studentPhone })
    .limit(1)
    .get();

  if (exist.data.length) {
    const stu = exist.data[0];
    await db.collection('students').doc(stu._id).update({
      data: {
        openid: OPENID,
        lastLoginAt: now
      }
    });

    return { success: true, studentId: stu._id };
  }

  const add = await db.collection('students').add({
    data: {
      studentNo,
      studentPhone,
      openid: OPENID,
      createdAt: now,
      lastLoginAt: now
    }
  });

  return { success: true, studentId: add._id };
};
