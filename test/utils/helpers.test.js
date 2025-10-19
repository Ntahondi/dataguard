const helpers = require('../../lib/utils/helpers');

describe('Helpers', () => {
  test('should check if value is object', () => {
    expect(helpers.isObject({})).toBe(true);
    expect(helpers.isObject([])).toBe(false);
    expect(helpers.isObject('string')).toBe(false);
    expect(helpers.isObject(null)).toBe(false);
  });

  test('should clone objects', () => {
    const original = { a: 1, b: { c: 2 } };
    const cloned = helpers.clone(original);
    
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original); // Different reference
  });

  test('should generate IDs', () => {
    const id1 = helpers.generateId();
    const id2 = helpers.generateId();
    
    expect(typeof id1).toBe('string');
    expect(id1).not.toBe(id2);
  });

  test('should mask sensitive data', () => {
    expect(helpers.maskSensitive('1234567890')).toBe('1234***7890');
    expect(helpers.maskSensitive('test@example.com')).toBe('test***.com');
    expect(helpers.maskSensitive('short')).toBe('***');
  });

  test('should validate emails', () => {
    expect(helpers.isValidEmail('test@example.com')).toBe(true);
    expect(helpers.isValidEmail('invalid-email')).toBe(false);
    expect(helpers.isValidEmail('@example.com')).toBe(false);
  });
});