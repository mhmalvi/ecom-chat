/**
 * Input validation utility
 */

/**
 * Validates that required fields are present
 * @param {Object} data Data object to validate
 * @param {Array} fields Required field names
 * @returns {Object} Result with isValid flag and any errors
 */
function validateRequired(data, fields = []) {
  const errors = [];
  
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`${field} is required`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates an email address
 * @param {string} email Email to validate
 * @returns {boolean} Whether the email is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates order data
 * @param {Object} orderData Order data to validate
 * @returns {Object} Result with isValid flag and any errors
 */
function validateOrderData(orderData) {
  const errors = [];
  
  // Check required fields
  const requiredCheck = validateRequired(orderData, ['items', 'customer']);
  if (!requiredCheck.isValid) {
    return requiredCheck;
  }
  
  // Check items
  if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
    errors.push('Order must contain at least one item');
  } else {
    // Validate each item
    for (let i = 0; i < orderData.items.length; i++) {
      const item = orderData.items[i];
      if (!item.product_id) {
        errors.push(`Item at index ${i} is missing product_id`);
      }
      if (!item.quantity || item.quantity < 1) {
        errors.push(`Item at index ${i} has invalid quantity`);
      }
    }
  }
  
  // Check customer
  const customer = orderData.customer;
  if (!customer) {
    errors.push('Customer information is required');
  } else {
    const customerCheck = validateRequired(customer, ['firstName', 'lastName', 'email']);
    if (!customerCheck.isValid) {
      errors.push(...customerCheck.errors.map(e => `Customer ${e}`));
    }
    
    // Check email format
    if (customer.email && !isValidEmail(customer.email)) {
      errors.push('Customer email is invalid');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitizes a string for safe use
 * @param {string} value Value to sanitize
 * @returns {string} Sanitized value
 */
function sanitizeString(value) {
  if (typeof value !== 'string') {
    return '';
  }
  
  // Remove HTML tags
  const sanitized = value.replace(/<[^>]*>/g, '');
  
  // Limit length
  return sanitized.substring(0, 1000);
}

module.exports = {
  validateRequired,
  isValidEmail,
  validateOrderData,
  sanitizeString
}; 