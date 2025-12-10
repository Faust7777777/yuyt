const API_BASE = "https://yuyt-steel.vercel.app/api";

function request(path, data = {}, method = "POST") {
  return new Promise((resolve, reject) => {
    wx.request({
      url: API_BASE + path,
      method,
      data,
      header: {
        "Content-Type": "application/json"
      },
      success: res => resolve(res.data),
      fail: err => reject(err)
    });
  });
}

module.exports = {
  request
};
