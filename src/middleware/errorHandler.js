/**
 * Central error handling middleware
 */

/**
 * Handles 404 errors when no route is matched
 */
function notFoundHandler(req, res, next) {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

/**
 * Converts errors to appropriate JSON responses
 */
function errorHandler(err, req, res, next) {
  // Set default status code to 500 if not specified
  const statusCode = err.statusCode || 500;
  
  // Basic error response
  const errorResponse = {
    error: err.message || 'Internal Server Error',
    statusCode
  };
  
  // In development, include stack trace
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    
    // Include original error details if available
    if (err.originalError) {
      errorResponse.originalError = {
        message: err.originalError.message,
        stack: err.originalError.stack
      };
    }
  }
  
  // Log errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    console.error('Server Error:', err);
  }
  
  res.status(statusCode).json(errorResponse);
}

/**
 * Handles uncaught async errors
 */
function asyncErrorHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  notFoundHandler,
  errorHandler,
  asyncErrorHandler
}; 