/**
 * User service for authentication and management
 */

const supabase = require('../lib/supabase');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/auth');
const logger = require('../utils/logger');

/**
 * Find user by email
 * @param {string} email User email
 * @returns {Object|null} User object or null if not found
 */
async function findUserByEmail(email) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      logger.error('Error finding user by email', { error: error.message, email });
      return null;
    }
    
    return data;
  } catch (error) {
    logger.error('Unexpected error finding user by email', { error: error.message, email });
    return null;
  }
}

/**
 * Find user by ID
 * @param {string} id User ID
 * @returns {Object|null} User object or null if not found
 */
async function findUserById(id) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logger.error('Error finding user by ID', { error: error.message, id });
      return null;
    }
    
    return data;
  } catch (error) {
    logger.error('Unexpected error finding user by ID', { error: error.message, id });
    return null;
  }
}

/**
 * Create a new user
 * @param {Object} userData User data
 * @returns {Object} Created user object
 */
async function createUser(userData) {
  try {
    // Check if user already exists
    const existingUser = await findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Create user in database
    const { data, error } = await supabase
      .from('users')
      .insert([{
        email: userData.email,
        password_hash: hashedPassword,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role || 'customer',
        store_id: userData.storeId
      }])
      .select()
      .single();
    
    if (error) {
      logger.error('Error creating user', { error: error.message });
      throw new Error(`Failed to create user: ${error.message}`);
    }
    
    // Remove sensitive fields
    delete data.password_hash;
    
    return data;
  } catch (error) {
    logger.error('User creation failed', { error: error.message });
    throw error;
  }
}

/**
 * Authenticate a user with email and password
 * @param {string} email User email
 * @param {string} password User password
 * @returns {Object} Authentication result with token and user
 */
async function authenticate(email, password) {
  try {
    // Find the user
    const user = await findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }
    
    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      storeId: user.store_id
    });
    
    // Remove sensitive fields
    delete user.password_hash;
    
    return {
      token,
      user
    };
  } catch (error) {
    logger.error('Authentication failed', { error: error.message, email });
    throw error;
  }
}

/**
 * Get user list (admin function)
 * @param {number} limit Maximum number of users to return
 * @param {number} offset Pagination offset
 * @param {string} storeId Optional store ID to filter by
 * @returns {Array} List of users
 */
async function getUsers(limit = 100, offset = 0, storeId = null) {
  try {
    let query = supabase
      .from('users')
      .select('id, email, first_name, last_name, role, store_id, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (storeId) {
      query = query.eq('store_id', storeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      logger.error('Error fetching users', { error: error.message });
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    logger.error('Error in getUsers', { error: error.message });
    throw error;
  }
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  authenticate,
  getUsers
}; 