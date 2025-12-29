// 🔥 接口配置中心 - 轻松切换本地/远程后端

// ==================== 配置区域 ====================

// 环境切换:改这一个变量即可!
const ENV = 'local';  // 'local' 或 'production'

// 后端地址配置
const API_BASE_URLS = {
  local: 'http://localhost:3000',           // 本地开发
  production: 'https://yourdomain.com/api'  // 生产环境(投资后填写)
};

// ==================== 时间段配置 ====================
// 🔥 统一的时间段配置（和教师端保持一致）
const TIME_SLOTS = [
  '08:00-09:35',
  '10:05-11:40',
  '13:30-15:05',
  '15:20-17:00'
];

// 🔥 统一的星期配置
const WEEK_DAYS = ['周一', '周二', '周三', '周四', '周五'];

// ==================== 教师配置 ====================
const TEACHERS = {
  'teacher01': { 
    id: 'teacher01',
    name: '宜老师',
    password: '123456'
  },
  'teacher02': { 
    id: 'teacher02',
    name: '佴老师',
    password: '123456'
  }
};

// 获取所有教师ID列表
const getTeacherIds = () => Object.keys(TEACHERS);

// 获取教师信息
const getTeacherInfo = (teacherId) => TEACHERS[teacherId] || null;

// ==================== 自动配置 ====================

const BASE_URL = API_BASE_URLS[ENV];

// 导出配置
module.exports = {
  ENV,
  BASE_URL,
  
  // 超时配置
  TIMEOUT: 10000,
  
  // 调试模式(生产环境自动关闭)
  DEBUG: ENV === 'local',
  
  // 🔥 时间段配置导出
  TIME_SLOTS,
  WEEK_DAYS,
  
  // 🔥 教师配置导出
  TEACHERS,
  getTeacherIds,
  getTeacherInfo
};
