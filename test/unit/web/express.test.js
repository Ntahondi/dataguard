const {
  dataGuardMiddleware,
  requireGDPRCompliance,
  validateConsent
} = require('../../../lib/web/express');

describe('Express Middleware', () => {
  test('should create middleware function', () => {
    const middleware = dataGuardMiddleware();
    expect(typeof middleware).toBe('function');
    expect(middleware.constructor.name).toBe('AsyncFunction');
  });

  test('should create GDPR compliance middleware', () => {
    const middleware = requireGDPRCompliance();
    expect(typeof middleware).toBe('function');
  });

  test('should create consent validation middleware', () => {
    const middleware = validateConsent(['marketing']);
    expect(typeof middleware).toBe('function');
  });
});