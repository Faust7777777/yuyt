const api = require('../../../utils/api');
const { WEEKDAYS, TIME_SLOTS } = require('../../../config/time-slots');

Page({
  data: {
    currentWeekOffset: 0,
    displayWeek: 1,
    appointments: []
  },

  onLoad() {
    this.loadAppointments();
  },

  onShow() {
    this.loadAppointments();
  },

  // 加载预约列表
  async loadAppointments() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      const res = await api.getTeacherAppointments();
      
      console.log('=== 教师查看预约记录 ===');
      console.log('API返回:', res);
      console.log('code:', res.code);
      console.log('data:', res.data);
      console.log('appointments:', res.data?.appointments);
      console.log('=====================');
      
      // ✅ 判断 code 而不是 success
      if (res.code !== 200) {
        throw new Error(res.message || '加载失败');
      }
      
      // 处理数据:添加星期和时间段名称
      const appointments = (res.data.appointments || []).map(item => {
        // day 和 slot 是数字索引,需要转换成名称
        const weekday = WEEKDAYS[item.day];
        const timeSlot = TIME_SLOTS[item.slot];
        
        console.log('处理预约:', {
          原始: item,
          星期: weekday,
          时段: timeSlot
        });
        
        return {
          ...item,
          weekdayName: weekday?.name || '未知',
          slotName: timeSlot?.name || '未知',
          time: timeSlot ? `${timeSlot.start}-${timeSlot.end}` : '未知'
        };
      });

      console.log('✅ 处理后的预约列表:', appointments);

      this.setData({
        appointments,
        displayWeek: this.data.currentWeekOffset + 1
      });

      if (appointments.length === 0) {
        wx.showToast({
          title: '暂无预约记录',
          icon: 'none'
        });
      }

    } catch (error) {
      console.error('❌ 加载失败:', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  prevWeek() {
    if (this.data.currentWeekOffset > 0) {
      this.setData({
        currentWeekOffset: this.data.currentWeekOffset - 1
      });
      this.loadAppointments();
    }
  },

  nextWeek() {
    if (this.data.currentWeekOffset < 3) {
      this.setData({
        currentWeekOffset: this.data.currentWeekOffset + 1
      });
      this.loadAppointments();
    }
  }
});
