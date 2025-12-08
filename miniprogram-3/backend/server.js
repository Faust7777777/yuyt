// backend/server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const appointmentRouter = require('./routes/appointment');
const scheduleRouter = require('./routes/schedule');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Mount routes under /api
app.use('/api/appointment', appointmentRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Backend started on port', port);
});
