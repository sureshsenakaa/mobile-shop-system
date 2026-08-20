const globalAuditLogger = require('./auditLogger').globalAuditLogger; // Adjust if necessary, just an import check

const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.originalUrl}`);
  console.error(err.stack);

  // Default error status and message
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Specific handling for known errors (like Sequelize validation errors)
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors.map(e => e.message)
    });
  }

  // General error response (hide stack trace in production)
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : message
  });
};

module.exports = errorHandler;
