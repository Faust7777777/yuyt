require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const appointmentRouter = require('./routes/appointment');
const scheduleRouter = require('./routes/schedule');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🔥 MongoDB Connect
mongoose.connect(process.env.MONGO_URI, {
  dbName: process.env.DB_NAME,
})
.then(() => console.log('Connected to MongoDB:', process.env.DB_NAME))
.catch(err => console.error('MongoDB Connection Error:', err));

// 🟢 Test endpoint
app.get('/', (req, res) => {
  res.send('Backend running!');
});

// API routes
app.use('/api/appointment', appointmentRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

// Server listen
const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log('Backend started on port', port)
);
