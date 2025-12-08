// backend/app.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const appointmentRoute = require('./routes/appointment');
const scheduleRoute = require('./routes/schedule');
const authRoute = require('./routes/auth');
const adminRoute = require('./routes/admin');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// mount routes under /api
app.use('/api/appointment', appointmentRoute);
app.use('/api/schedule', scheduleRoute);
app.use('/api/auth', authRoute);
app.use('/api/admin', adminRoute);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
