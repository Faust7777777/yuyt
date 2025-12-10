// backend/server.js
const app = require("./app");

// 关键：必须导出一个函数！不能只导出 app！
module.exports = (req, res) => {
  return app(req, res);
};
