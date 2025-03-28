const allowedOrigins = require("./allowed_origins");

const corsOptions = {
  origin: (origin, callback) => {
    // to remove !origin in production
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Opps, you are not allowed to access this resource"));
    }
  },
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;
