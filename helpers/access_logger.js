const winston = require("winston");
require("winston-daily-rotate-file");

const accessTransport = new winston.transports.DailyRotateFile({
  filename: "./logs/access/access-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
});

 

const { combine, timestamp, printf } = winston.format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const accessLogger = winston.createLogger({
  level: "info",
  format: combine(timestamp(), myFormat, winston.format.json()),
  transports: [accessTransport],
});

module.exports = accessLogger;
