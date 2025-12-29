// app.js
App({
  onLaunch: function () {
    // ✅ 第一步：检查云开发能力
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
      return;
    }
    
    // ✅ 第二步：立即初始化云开发
    wx.cloud.init({
      env: "cloudbase-6gtscka259dcb7be",
      traceUser: true,
    });
    
    console.log('☁️ 云开发初始化成功');
    
    // ✅ 第三步：设置全局数据
    this.globalData = {
      env: "cloudbase-6gtscka259dcb7be"
    };
  },
});
