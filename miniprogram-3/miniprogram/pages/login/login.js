const API = require('../../utils/api');

Page({
  data: {
    username: '',
    password: '',
    role: 'student',
    roleOptions: [
      { value: 'student', label: '学生' },
      { value: 'teacher', label: '教师' }
    ]
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  onRoleChange(e) {
    const index = e.detail.value;
    this.setData({ 
      role: this.data.roleOptions[index].value 
    });
  },

  async login() {
    const { username, password, role } = this.data;

    if (!username || !password) {
      wx.showToast({
        title: '请输入用户名和密码',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({ title: '登录中...' });
      
      const res = await API.login(username, password, role);
      
      wx.hideLoading();

      if (res.code === 200) {
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });

        setTimeout(() => {
          if (role === 'teacher') {
            wx.redirectTo({
              url: '/pages/teacher/teacher-schedule/teacher-schedule'
            });
          } else {
            wx.redirectTo({
              url: '/pages/student/schedule/schedule'
            });
          }
        }, 1500);
      }
    } catch (err) {
      wx.hideLoading();
      wx.showModal({
        title: '登录失败',
        content: err.message || '用户名或密码错误',
        showCancel: false
      });
    }
  },

  // 快速填充测试账号
  fillStudent() {
    this.setData({
      username: 'student01',
      password: '123456',
      role: 'student'
    });
  },

  fillTeacher() {
    this.setData({
      username: 'teacher01',
      password: '123456',
      role: 'teacher'
    });
  }
});
