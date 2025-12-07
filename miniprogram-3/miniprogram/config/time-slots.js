// 时间段配置
const TIME_SLOTS = [
  { 
    id: 1, 
    name: '第一班', 
    start: '08:00', 
    end: '09:35' 
  },
  { 
    id: 2, 
    name: '第二班', 
    start: '10:05', 
    end: '11:40' 
  },
  { 
    id: 3, 
    name: '第三班', 
    start: '13:30', 
    end: '15:05' 
  },
  { 
    id: 4, 
    name: '第四班', 
    start: '15:20', 
    end: '17:00' 
  }
];

// 工作日配置
const WEEKDAYS = [
  { id: 1, name: '周一' },
  { id: 2, name: '周二' },
  { id: 3, name: '周三' },
  { id: 4, name: '周四' },
  { id: 5, name: '周五' }
];

module.exports = {
  TIME_SLOTS,
  WEEKDAYS
};
