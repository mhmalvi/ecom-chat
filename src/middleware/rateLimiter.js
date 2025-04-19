/**
 * Simple in-memory rate limiter
 * In production, use a Redis-based solution for distributed environments
 */

// Track request counts per IP
const requestCounts = {};

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  // Remove entries older than 1 hour
  Object.keys(requestCounts).forEach(key => {
    if (now - requestCounts[key].timestamp > 60 * 60 * 1000) {
      delete requestCounts[key];
    }
  });
}, 60 * 60 * 1000);

/**
 * Rate limit middleware
 * @param {Object} options Rate limit configuration
 * @returns {Function} Express middleware
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 60 * 1000, // 1 minute default
    max = 60,             // 60 requests per minute default
    message = 'Too many requests, please try again later.',
    statusCode = 429,
    keyGenerator = (req) => req.ip || req.headers['x-forwarded-for'] || 'unknown',
    skip = () => false,
    headers = true,
  } = options;

  return (req, res, next) => {
    if (skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();

    // Initialize or reset if window expired
    if (!requestCounts[key] || now - requestCounts[key].timestamp > windowMs) {
      requestCounts[key] = {
        count: 1,
        timestamp: now,
      };
      return next();
    }

    // Increment count
    requestCounts[key].count++;

    // Check if over limit
    if (requestCounts[key].count > max) {
      if (headers) {
        res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', Math.ceil((requestCounts[key].timestamp + windowMs) / 1000));
      }
      
      return res.status(statusCode).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Not over limit, set headers and continue
    if (headers) {
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - requestCounts[key].count));
      res.setHeader('X-RateLimit-Reset', Math.ceil((requestCounts[key].timestamp + windowMs) / 1000));
    }

    next();
  };
}

// Create rate limiters with different configurations
const defaultLimiter = createRateLimiter();
const apiLimiter = createRateLimiter({ 
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // 60 requests per minute
  message: 'Too many API requests, please try again later.' 
});
const chatLimiter = createRateLimiter({ 
  windowMs: 60 * 1000, // 1 minute
  max: 20,             // 20 chat requests per minute (AI is expensive)
  message: 'Too many chat requests, please try again later.'
});

module.exports = {
  defaultLimiter,
  apiLimiter,
  chatLimiter
}; 