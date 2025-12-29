const API = require('../../../utils/api');
const config = require('../../../utils/config');  // 🔥 新增

Page({
  data: {
    weekDays: config.WEEK_DAYS,      // 🔥 从配置读取
    timeSlots: config.TIME_SLOTS,    // 🔥 从配置读取
    confirmedSlots: [],   // 🟢 已确认的时间段(绿色)
    pendingSlots: [],     // 🟡 待确认的时间段(黄色)
    deletingSlots: []     // 🔴 待删除的时间段(灰色)
  },  // 🔥 注意这里有逗号！

  onLoad() {
    this.loadSchedule();
  },

  async loadSchedule() {
    try {
      wx.showLoading({ title: '加载中...' });
      const res = await API.getTeacherSchedule();
      
      if (res.code === 200) {
        this.setData({
          confirmedSlots: res.data.schedule || [],
          pendingSlots: [],
          deletingSlots: []
        });
      }
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      console.log('加载失败', err);
    }
  },

  // 点击时间格子
  toggleSlot(e) {
    const { day, slot } = e.currentTarget.dataset;
    
    // 检查是否在各个状态中
    const isConfirmed = this.isInList(this.data.confirmedSlots, day, slot);
    const isPending = this.isInList(this.data.pendingSlots, day, slot);
    const isDeleting = this.isInList(this.data.deletingSlots, day, slot);

    let confirmed = [...this.data.confirmedSlots];
    let pending = [...this.data.pendingSlots];
    let deleting = [...this.data.deletingSlots];

    if (isConfirmed) {
      // 🟢 点击已确认 → 标记为删除(灰色)
      deleting.push({ day, slot });
    } else if (isDeleting) {
      // 🔴 点击待删除 → 取消删除(恢复绿色)
      deleting = deleting.filter(item => !(item.day === day && item.slot === slot));
    } else if (isPending) {
      // 🟡 点击待确认 → 取消选择(恢复空白)
      pending = pending.filter(item => !(item.day === day && item.slot === slot));
    } else {
      // ⬜ 点击空白 → 临时选中(黄色)
      pending.push({ day, slot });
    }

    this.setData({
      confirmedSlots: confirmed,
      pendingSlots: pending,
      deletingSlots: deleting
    });
  },

  // 辅助函数:检查时段是否在列表中
  isInList(list, day, slot) {
    return list.some(item => item.day === day && item.slot === slot);
  },

  // 判断时段状态(用于 WXML)
  getSlotStatus(day, slot) {
    if (this.isInList(this.data.deletingSlots, day, slot)) return 'deleting'; // 灰色
    if (this.isInList(this.data.confirmedSlots, day, slot)) return 'confirmed'; // 绿色
    if (this.isInList(this.data.pendingSlots, day, slot)) return 'pending'; // 黄色
    return ''; // 空白
  },

  // 确认设置(保存黄色时段)
  async confirmAdd() {
    if (this.data.pendingSlots.length === 0) {
      wx.showToast({
        title: '没有待确认的时间段',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({ title: '保存中...' });
      
      // 合并已确认 + 待确认
      const allSlots = [...this.data.confirmedSlots, ...this.data.pendingSlots];
      
      const res = await API.saveSchedule(allSlots);
      
      wx.hideLoading();
      
      if (res.code === 200) {
        // 🟡 黄色 → 🟢 绿色
        this.setData({
          confirmedSlots: allSlots,
          pendingSlots: []
        });
        
        wx.showToast({
          title: '设置成功',
          icon: 'success'
        });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showModal({
        title: '保存失败',
        content: err.message || '请稍后重试',
        showCancel: false
      });
    }
  },

  // 确认删除(删除灰色时段)
  async confirmDelete() {
    if (this.data.deletingSlots.length === 0) {
      wx.showToast({
        title: '没有待删除的时间段',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({ title: '删除中...' });
      
      // 移除待删除的时段
      const confirmed = this.data.confirmedSlots.filter(
        confirmed => !this.data.deletingSlots.some(
          deleting => deleting.day === confirmed.day && deleting.slot === confirmed.slot
        )
      );
      
      const res = await API.saveSchedule(confirmed);
      
      wx.hideLoading();
      
      if (res.code === 200) {
        // 🔴 灰色 → ⬜ 空白
        this.setData({
          confirmedSlots: confirmed,
          deletingSlots: []
        });
        
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showModal({
        title: '删除失败',
        content: err.message || '请稍后重试',
        showCancel: false
      });
    }
  },

  // 跳转到预约记录页面
  viewAppointments() {
    wx.navigateTo({
      url: '/pages/teacher/teacher-appointments/teacher-appointments'
    });
  }
});
