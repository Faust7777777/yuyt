const API = require('../../utils/api');

Page({
  data: {
    username: '',
    password: '',
    studentNo: '',
    studentPhone: '',
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

  onStudentNoInput(e) {
    this.setData({ studentNo: e.detail.value });
  },

  onStudentPhoneInput(e) {
    this.setData({ studentPhone: e.detail.value });
  },

  onRoleChange(e) {
    const index = e.detail.value;
    this.setData({
      role: this.data.roleOptions[index].value
    });
  },

  async login() {
    const { role } = this.data;

    try {
      wx.showLoading({ title: '登录中...' });

      let res;

      if (role === 'teacher') {
        const { username, password } = this.data;

        if (!username || !password) {
          wx.hideLoading();
          wx.showToast({ title: '请输入用户名和密码', icon: 'none' });
          return;
        }

        res = await API.login(username, password, role);
      } else {
        const { studentNo, studentPhone } = this.data;

        if (!studentNo || !studentPhone) {
          wx.hideLoading();
          wx.showToast({ title: '请输入学号和手机号', icon: 'none' });
          return;
        }

        if (!/^\d{11}$/.test(studentPhone)) {
          wx.hideLoading();
          wx.showToast({ title: '手机号应为 11 位数字', icon: 'none' });
          return;
        }

        res = await API.studentLogin(studentNo, studentPhone);
      }

      wx.hideLoading();

      if (res.code === 200) {
        wx.showToast({ title: '登录成功', icon: 'success' });

        setTimeout(() => {
          wx.redirectTo({
            url:
              role === 'teacher'
                ? '/pages/teacher/teacher-schedule/teacher-schedule'
                : '/pages/student/schedule/schedule'
          });
        }, 800);
      } else {
        throw new Error(res.message || '登录失败');
      }
    } catch (err) {
      wx.hideLoading();
      wx.showModal({
        title: '登录失败',
        content: err.message || '登录失败',
        showCancel: false
      });
    }
  }
});
