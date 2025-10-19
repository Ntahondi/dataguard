/**
 * Utility functions for DataGuard
 */
const helpers = {
  /**
   * Check if value is an object
   */
    isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
    },

  /**
   * Deep clone an object
   */
  clone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * Generate a random ID
   */
  generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  },

  /**
   * Mask sensitive data for logging
   */
  maskSensitive(value, visibleChars = 4) {
    if (!value || typeof value !== 'string') return value;
    if (value.length <= visibleChars * 2) return '***';
    
    const firstPart = value.substring(0, visibleChars);
    const lastPart = value.substring(value.length - visibleChars);
    return `${firstPart}***${lastPart}`;
  },

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

module.exports = helpers;