const errorLogger = require("../helpers/error_logger");

const globalErorrHandler = (err, req, res, next) => {
    let emsg = `Error: ${err}, Request:${req.originalUrl}`
    errorLogger.error(emsg)
    console.error(err.stack)
    return res.status(500).send('Failed to process request.')
  }

module.exports = globalErorrHandler