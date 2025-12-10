require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const appointmentRouter = require("./routes/appointment");
const scheduleRouter = require("./routes/schedule");
const authRouter = require("./routes/auth");

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Backend running!");
});

app.use("/api/appointment", appointmentRouter);
app.use("/api/schedule", scheduleRouter);
app.use("/api/auth", authRouter);

module.exports = app;
