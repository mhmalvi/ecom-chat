/**
 * Standardized logging utility
 * In production, consider using a more robust logging solution (Winston, Bunyan, etc.)
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Set default log level based on environment
const DEFAULT_LOG_LEVEL = process.env.NODE_ENV === 'production' 
  ? LOG_LEVELS.INFO 
  : LOG_LEVELS.DEBUG;

// Current log level
let currentLogLevel = process.env.LOG_LEVEL 
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] 
  : DEFAULT_LOG_LEVEL;

/**
 * Format log message with timestamp and metadata
 * @param {string} level Log level
 * @param {string} message Log message
 * @param {Object} meta Additional metadata
 * @returns {string} Formatted log message
 */
function formatLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const metaString = Object.keys(meta).length 
    ? JSON.stringify(meta) 
    : '';
  
  return `[${timestamp}] [${level}] ${message} ${metaString}`.trim();
}

/**
 * Log an error message
 * @param {string} message Log message
 * @param {Object} meta Additional metadata
 */
function error(message, meta = {}) {
  if (currentLogLevel >= LOG_LEVELS.ERROR) {
    console.error(formatLog('ERROR', message, meta));
  }
}

/**
 * Log a warning message
 * @param {string} message Log message
 * @param {Object} meta Additional metadata
 */
function warn(message, meta = {}) {
  if (currentLogLevel >= LOG_LEVELS.WARN) {
    console.warn(formatLog('WARN', message, meta));
  }
}

/**
 * Log an info message
 * @param {string} message Log message
 * @param {Object} meta Additional metadata
 */
function info(message, meta = {}) {
  if (currentLogLevel >= LOG_LEVELS.INFO) {
    console.info(formatLog('INFO', message, meta));
  }
}

/**
 * Log a debug message
 * @param {string} message Log message
 * @param {Object} meta Additional metadata
 */
function debug(message, meta = {}) {
  if (currentLogLevel >= LOG_LEVELS.DEBUG) {
    console.debug(formatLog('DEBUG', message, meta));
  }
}

/**
 * Set the current log level
 * @param {string} level Log level name
 */
function setLogLevel(level) {
  if (LOG_LEVELS[level.toUpperCase()] !== undefined) {
    currentLogLevel = LOG_LEVELS[level.toUpperCase()];
  }
}

module.exports = {
  error,
  warn,
  info,
  debug,
  setLogLevel,
  LOG_LEVELS
}; 