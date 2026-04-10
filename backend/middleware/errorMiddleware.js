// Catches any error thrown anywhere in the app
// Without this, Express sends ugly HTML error pages

const errorHandler = (err, req, res, next) => {
  // Sometimes an error is thrown but status code is still 200 — fix that
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Only show full error stack in development
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

// Handles routes that don't exist at all
const notFound = (req, res, next) => {
  const error = new Error(`Route Not Found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound };