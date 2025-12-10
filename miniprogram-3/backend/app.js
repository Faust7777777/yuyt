// app.js —— Express 主体（你之前缺的就是它）

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// 路由文件
const appointmentRouter = require('./routes/appointment');
const scheduleRouter = require('./routes/schedule');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// 测试接口
app.get('/', (req, res) => {
  res.send("Backend running!");
});

// 注册路由
app.use('/api/appointment', appointmentRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

// 注意：这里不要 app.listen()
// 因为 Vercel 会自动启动

module.exports = app;


