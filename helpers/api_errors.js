
const errorLogger = require("../helpers/error_logger");
class ApiError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
    }
}

const handleApiError = (error, req, res) => {
    if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
            message: error.message,
            details: error.details
        });
    }

    // Log unexpected errors
    errorLogger.error(`Error: ${error}, Request: ${req.originalUrl}`);
    return res.status(500).json({ message: "Internal Server Error" });
};

module.exports = {
    ApiError,
    handleApiError
}; 