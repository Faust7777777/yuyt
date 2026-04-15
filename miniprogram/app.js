App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }

    const cloudEnvId = wx.cloud.DYNAMIC_CURRENT_ENV;

    wx.cloud.init({
      env: cloudEnvId,
      traceUser: true
    });

    console.log('☁️ 云开发初始化成功');

    this.globalData = {
      env: cloudEnvId
    };
  }
});
