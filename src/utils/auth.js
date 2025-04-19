/**
 * Authentication utility for JWT handling
 */

const jwt = require('jsonwebtoken');

// Secret key for JWT signing (should be in .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1d';

/**
 * Generate a new JWT token
 * @param {Object} payload Data to include in token
 * @param {string} expiresIn Token expiration time
 * @returns {string} JWT token
 */
function generateToken(payload, expiresIn = JWT_EXPIRY) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify a JWT token
 * @param {string} token JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from request
 * @param {Object} req Express request object
 * @returns {string|null} JWT token or null if not found
 */
function extractTokenFromRequest(req) {
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    return req.headers.authorization.split(' ')[1];
  }
  if (req.query && req.query.token) {
    return req.query.token;
  }
  return null;
}

/**
 * JWT authentication middleware
 * @returns {Function} Express middleware
 */
function authMiddleware() {
  return (req, res, next) => {
    const token = extractTokenFromRequest(req);
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Add user info to request object
    req.user = decoded;
    next();
  };
}

/**
 * Role-based authorization middleware
 * @param {Array} allowedRoles Roles allowed to access the route
 * @returns {Function} Express middleware
 */
function roleMiddleware(allowedRoles = []) {
  return (req, res, next) => {
    // Must be used after authMiddleware
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // If no roles specified, allow all authenticated users
    if (allowedRoles.length === 0) {
      return next();
    }
    
    // Check if user has an allowed role
    const userRole = req.user.role || 'guest';
    if (allowedRoles.includes(userRole)) {
      return next();
    }
    
    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}

module.exports = {
  generateToken,
  verifyToken,
  extractTokenFromRequest,
  authMiddleware,
  roleMiddleware
}; 