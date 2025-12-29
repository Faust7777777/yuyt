import API from '../../../utils/api';
import { TIME_SLOTS, WEEKDAYS } from '../../../config/time-slots';

Page({
  data: {
    timeSlots: TIME_SLOTS,
    weekdays: WEEKDAYS,
    selectedSlots: [] // [{ weekday: 1, slotId: 1 }, ...]
  },

  onLoad() {
    this.loadCurrentSettings();
  },

  async loadCurrentSettings() {
    try {
      const res = await API.getTeacherSchedule(0);
      this.setData({
        selectedSlots: res.availableSlots || []
      });
    } catch (err) {
      console.error('加载失败', err);
    }
  },

  isSelected(weekday, slotId) {
    return this.data.selectedSlots.some(
      s => s.weekday === weekday && s.slotId === slotId
    );
  },

  toggleSlot(e) {
    const { day, slot } = e.currentTarget.dataset;
    let selectedSlots = [...this.data.selectedSlots];
    
    const index = selectedSlots.findIndex(
      s => s.weekday === day && s.slotId === slot
    );

    if (index > -1) {
      selectedSlots.splice(index, 1);
    } else {
      selectedSlots.push({ weekday: day, slotId: slot });
    }

    this.setData({ selectedSlots });
  },

  async saveSettings() {
    try {
      wx.showLoading({ title: '保存中...' });
      await API.setAvailableTime(this.data.selectedSlots);
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  goToAppointments() {
    wx.navigateTo({
      url: '/pages/teacher/appointments/appointments'
    });
  }
});
