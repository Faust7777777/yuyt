// 小程序侧统一配置

const TIME_SLOTS = [
  '08:00-09:35',
  '10:05-11:40',
  '13:30-15:05',
  '15:20-17:00'
];

const WEEK_DAYS = ['周一', '周二', '周三', '周四', '周五'];

// 公开仓库仅保留示例教师标识，真实账号数据应由云数据库维护。
const TEACHERS = {
  teacher01: {
    id: 'teacher01',
    name: '宜老师'
  },
  teacher02: {
    id: 'teacher02',
    name: '佴老师'
  }
};

const getTeacherInfo = (teacherId) => TEACHERS[teacherId] || null;

module.exports = {
  TIME_SLOTS,
  WEEK_DAYS,
  TEACHERS,
  getTeacherInfo
};
