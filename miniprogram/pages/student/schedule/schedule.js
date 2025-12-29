const api = require('../../../utils/api');
const config = require('../../../utils/config');

Page({
  data: {
    weekDays: config.WEEK_DAYS,
    timeSlots: config.TIME_SLOTS,
    availableSlots: [],
    showTeacherPicker: false,
    currentTeachers: [],
    selectedDay: null,
    selectedSlot: null,
    myBookings: []
  },

  onLoad() {
    this.loadSchedule();
    this.loadMyBookings();
  },

  onShow() {
    this.loadSchedule();
    this.loadMyBookings();
  },

  /* ================= 时间规则工具 ================= */

  // 周一 = 0 ... 周日 = 6
  getTodayIndex() {
    const jsDay = new Date().getDay(); // 0=周日
    return (jsDay + 6) % 7;
  },

  getNowHM() {
    const now = new Date();
    return { h: now.getHours(), m: now.getMinutes() };
  },

  isAfterTime(hh, mm) {
    const { h, m } = this.getNowHM();
    return h > hh || (h === hh && m >= mm);
  },

  // 周五 17:05 视为“归档完成”
  isAfterFridayArchive() {
    const FRIDAY = 4;
    return this.getTodayIndex() === FRIDAY && this.isAfterTime(17, 5);
  },

  // ✅ 核心：是否允许取消预约
  canCancelBooking(booking) {
    const today = this.getTodayIndex();

    // 当天 17:00 后不可取消当天预约
    if (booking.day === today && this.isAfterTime(17, 0)) return false;

    // 归档前不可取消过去预约
    if (booking.day < today && !this.isAfterFridayArchive()) return false;

    return true;
  },

  /* ================= 数据加载 ================= */

  async loadSchedule() {
    wx.showLoading({ title: '加载中...' });
    const res = await api.getAvailableSlots();
    wx.hideLoading();

    if (res.code === 200) {
      this.setData({ availableSlots: res.data.slots });
    }
  },

  async loadMyBookings() {
    const res = await api.getMyBookings();
    if (res.code === 200) {
      this.setData({ myBookings: res.data.bookings });
    }
  },

  isMyBooking(day, slot) {
    return this.data.myBookings.some(b => b.day === day && b.slot === slot);
  },

  getMyBookingForSlot(day, slot) {
    return this.data.myBookings.find(b => b.day === day && b.slot === slot);
  },

  /* ================= 点击格子 ================= */

  bookSlot(e) {
    const day = Number(e.currentTarget.dataset.day);
    const slot = Number(e.currentTarget.dataset.slot);

    // 点击的是自己的预约 → 尝试取消
    if (this.isMyBooking(day, slot)) {
      const booking = this.getMyBookingForSlot(day, slot);

      if (!this.canCancelBooking(booking)) {
        wx.showToast({
          title: booking.day === this.getTodayIndex()
            ? '当天17:00后不可取消'
            : '周五归档前不可取消过去预约',
          icon: 'none'
        });
        return;
      }

      this.showCancelConfirm(booking);
      return;
    }

    // 新预约逻辑
    const slotInfo = this.data.availableSlots.find(
      s => s.day === day && s.slot === slot
    );

    if (!slotInfo || slotInfo.booked) {
      wx.showToast({ title: '该时间段不可预约', icon: 'none' });
      return;
    }

    this.setData({
      showTeacherPicker: true,
      currentTeachers: slotInfo.availableTeachers,
      selectedDay: day,
      selectedSlot: slot
    });
  },

  showCancelConfirm(booking) {
    wx.showModal({
      title: '取消预约',
      content: `确定取消 ${booking.teacherName} 的预约吗？`,
      confirmColor: '#e53935',
      success: res => {
        if (res.confirm) this.confirmCancel(booking._id);
      }
    });
  },

  async confirmCancel(bookingId) {
    const booking = this.data.myBookings.find(b => b._id === bookingId);
    if (booking && !this.canCancelBooking(booking)) {
      wx.showToast({ title: '当前规则下不可取消', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '取消中...' });
    const res = await api.cancelBooking(bookingId);
    wx.hideLoading();

    if (res.code === 200) {
      wx.showToast({ title: '取消成功', icon: 'success' });
      this.loadSchedule();
      this.loadMyBookings();
    } else {
      wx.showToast({ title: res.message, icon: 'none' });
    }
  },

  async selectTeacher(e) {
    const teacherId = e.currentTarget.dataset.teacherId;
    this.setData({ showTeacherPicker: false });

    wx.showLoading({ title: '预约中...' });
    const slotInfo = this.data.availableSlots.find(
      s => s.day === this.data.selectedDay && s.slot === this.data.selectedSlot
    );

    const slotId = `${slotInfo.day}-${slotInfo.slot}`;
    const res = await api.bookSlot(slotId, teacherId);
    wx.hideLoading();

    if (res.code === 200) {
      wx.showToast({ title: '预约成功', icon: 'success' });
      this.loadSchedule();
      this.loadMyBookings();
    } else {
      wx.showToast({ title: res.message, icon: 'none' });
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
