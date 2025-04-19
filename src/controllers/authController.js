/**
 * Authentication controller
 */

const userService = require('../services/userService');
const validator = require('../utils/validator');
const { generateToken } = require('../utils/auth');
const logger = require('../utils/logger');

/**
 * User registration
 * @param {Object} req Express request
 * @param {Object} res Express response
 */
async function register(req, res) {
  try {
    const { email, password, firstName, lastName, storeId } = req.body;
    
    // Validate required fields
    const validation = validator.validateRequired(
      req.body, 
      ['email', 'password', 'firstName', 'lastName']
    );
    
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: validation.errors
      });
    }
    
    // Validate email format
    if (!validator.isValidEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }
    
    // Create user
    const user = await userService.createUser({
      email,
      password,
      firstName,
      lastName,
      storeId,
      role: 'customer' // Default role for self-registration
    });
    
    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      storeId: user.store_id
    });
    
    res.status(201).json({
      message: 'Registration successful',
      token,
      user
    });
  } catch (error) {
    logger.error('Registration failed', { error: error.message });
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * User login
 * @param {Object} req Express request
 * @param {Object} res Express response
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    const validation = validator.validateRequired(
      req.body, 
      ['email', 'password']
    );
    
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: validation.errors
      });
    }
    
    // Authenticate user
    const result = await userService.authenticate(email, password);
    
    res.json({
      message: 'Login successful',
      token: result.token,
      user: result.user
    });
  } catch (error) {
    logger.error('Login failed', { error: error.message });
    
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({ error: error.message });
    }
    
    res.status(500).json({
      error: 'Login failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get authenticated user profile
 * @param {Object} req Express request
 * @param {Object} res Express response
 */
async function getProfile(req, res) {
  try {
    // User is already authenticated via middleware
    const userId = req.user.id;
    
    // Get fresh user data
    const user = await userService.findUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove sensitive data
    delete user.password_hash;
    
    res.json({ user });
  } catch (error) {
    logger.error('Get profile failed', { error: error.message });
    
    res.status(500).json({
      error: 'Failed to get profile',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = {
  register,
  login,
  getProfile
}; 