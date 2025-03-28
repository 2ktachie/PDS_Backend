const accessLogger = require("../helpers/access_logger");

const accessHandler = (req, res, next) => {
  let msg = `-- Host: ${req.hostname}, Ip: ${req.ip}, Protocol: ${req.protocol}, Method: ${req.method}, Url: ${req.originalUrl} --`;
  accessLogger.info(msg);
  next();
};

module.exports = accessHandler;
