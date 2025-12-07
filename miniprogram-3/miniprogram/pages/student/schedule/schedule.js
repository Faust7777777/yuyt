const api = require('../../../utils/api');
const config = require('../../../utils/config');

Page({
  data: {
    weekDays: config.WEEK_DAYS,    // 🔥 从配置读取
    timeSlots: config.TIME_SLOTS,  // 🔥 从配置读取
    availableSlots: [],
    
    // ... 其他代码不变

    
    // 教师选择弹窗
    showTeacherPicker: false,
    currentTeachers: [],
    selectedDay: null,
    selectedSlot: null,
    
    // 我的预约记录
    myBookings: []
  },

  onLoad() {
    this.loadSchedule();
    this.loadMyBookings();
    
    // 🔥 调试代码
    console.log('========== 调试信息 ==========');
    console.log('weekDays:', this.data.weekDays);
    console.log('timeSlots:', this.data.timeSlots);
    console.log('availableSlots:', this.data.availableSlots);
    console.log('myBookings:', this.data.myBookings);
    console.log('==============================');
  },
  
  onShow() {
    this.loadSchedule();
    this.loadMyBookings();
  },

  async loadSchedule() {
    wx.showLoading({ title: '加载中...' });
    
    const res = await api.getAvailableSlots();
    
    wx.hideLoading();
    
    if (res.code === 200) {
      this.setData({
        availableSlots: res.data.slots
      });
    } else {
      wx.showToast({
        title: res.message,
        icon: 'none'
      });
    }
  },

  async loadMyBookings() {
    const res = await api.getMyBookings();
    if (res.code === 200) {
      this.setData({
        myBookings: res.data.bookings
      });
    }
  },

  isMyBooking(day, slot) {
    return this.data.myBookings.some(
      b => b.day === day && b.slot === slot
    );
  },

  getMyBookingForSlot(day, slot) {
    return this.data.myBookings.find(
      b => b.day === day && b.slot === slot
    );
  },

  bookSlot(e) {
    const { day, slot } = e.currentTarget.dataset;
    const dayNum = parseInt(day);
    const slotNum = parseInt(slot);
    
    // 先检查是否是我的预约
    if (this.isMyBooking(dayNum, slotNum)) {
      const booking = this.getMyBookingForSlot(dayNum, slotNum);
      this.showCancelConfirm(booking);
      return;
    }
    
    // 查找该时段信息
    const slotInfo = this.data.availableSlots.find(
      s => s.day === dayNum && s.slot === slotNum
    );
    
    if (!slotInfo) {
      wx.showToast({
        title: '该时间段不可预约',
        icon: 'none'
      });
      return;
    }
    
    if (slotInfo.booked) {
      wx.showToast({
        title: '该时间段已约满',
        icon: 'none'
      });
      return;
    }
    
    // 显示教师选择弹窗
    this.setData({
      showTeacherPicker: true,
      currentTeachers: slotInfo.availableTeachers,
      selectedDay: dayNum,
      selectedSlot: slotNum
    });
  },

  showCancelConfirm(booking) {
    wx.showModal({
      title: '取消预约',
      content: `确定要取消与 ${booking.teacherName} 的预约吗?\n时间:${this.data.weekDays[booking.day]} ${this.data.timeSlots[booking.slot]}`,
      confirmText: '确定取消',
      confirmColor: '#e53935',
      success: (res) => {
        if (res.confirm) {
          this.confirmCancel(booking._id);
        }
      }
    });
  },

  async confirmCancel(bookingId) {
    wx.showLoading({ title: '取消中...' });
    
    const res = await api.cancelBooking(bookingId);
    
    wx.hideLoading();
    
    if (res.code === 200) {
      wx.showToast({
        title: '取消成功',
        icon: 'success'
      });
      this.loadSchedule();
      this.loadMyBookings();
    } else {
      wx.showToast({
        title: res.message,
        icon: 'none'
      });
    }
  },

  async selectTeacher(e) {
    const teacherId = e.currentTarget.dataset.teacherId;
    
    this.setData({ showTeacherPicker: false });
    
    wx.showLoading({ title: '预约中...' });
    
    // 找回完整 slot 信息（含真实 day/slot）
const slotInfo = this.data.availableSlots.find(
  s => s.day === this.data.selectedDay && s.slot === this.data.selectedSlot
);

if (!slotInfo) {
  wx.showToast({ title: '无效预约，请刷新重试', icon: 'none' });
  return;
}

// 提交给云函数的 slotId 必须是 数据库格式 day-slot
const slotId = `${slotInfo.day}-${slotInfo.slot}`;
const res = await api.bookSlot(slotId, teacherId);

    
    wx.hideLoading();
    
    if (res.code === 200) {
      wx.showToast({
        title: '预约成功',
        icon: 'success'
      });
      this.loadSchedule();
      this.loadMyBookings();
    } else {
      wx.showToast({
        title: res.message,
        icon: 'none'
      });
    }
  },

  cancelPicker() {
    this.setData({
      showTeacherPicker: false,
      currentTeachers: [],
      selectedDay: null,
      selectedSlot: null
    });
  }
});
