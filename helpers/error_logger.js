const winston = require("winston");
require("winston-daily-rotate-file");

const errorTransport = new winston.transports.DailyRotateFile({
  filename: "./logs/error/error-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
});

// const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = winston.format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const errorLogger = winston.createLogger({
  level: "info",
  format: combine(timestamp(), myFormat, winston.format.json()),
  transports: [errorTransport],
});

//
// If we're not in production then log to the `console` with the format:
//

if (process.env.NODE_ENV !== "production") {
  errorLogger.add(
    new winston.transports.Console({
      colorize: true,
      format: winston.format.simple(),
    })
  );
}

module.exports = errorLogger;
