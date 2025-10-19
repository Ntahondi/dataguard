const DataGuard = require('../../../lib/core/DataGuard');

describe('DataGuard Core', () => {
  let dataGuard;

  beforeEach(() => {
    dataGuard = new DataGuard({
      autoEncrypt: false, // Disable encryption for predictable tests
      requireExplicitConsent: true
    });
  });

  test('should initialize correctly', async () => {
    await dataGuard.initialize();
    expect(dataGuard.initialized).toBe(true);
  });

  test('should make data compliant', async () => {
    const testData = {
      email: 'test@example.com',
      phone: '+1234567890',
      name: 'Test User'
    };

    const result = await dataGuard.makeCompliant(testData, {
      country: 'US',
      action: 'registration'
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('_compliance');
    expect(result.compliance.applicableLaws).toContain('GDPR');
  });

  test('should classify data fields', async () => {
    const testData = {
      email: 'test@example.com',
      phone: '+1234567890',
      birthdate: '1990-01-01'
    };

    const classifications = await dataGuard.classifyData(testData);
    
    expect(Array.isArray(classifications)).toBe(true);
    expect(classifications.length).toBeGreaterThan(0);
    
    const emailClassification = classifications.find(c => c.field === 'email');
    expect(emailClassification).toBeDefined();
    expect(emailClassification.sensitivity).toBe('high');
  });

  test('should handle deletion requests', async () => {
    const result = await dataGuard.handleDeletionRequest('user123', 'GDPR');
    
    expect(result.success).toBe(true);
    expect(result.actions).toBeInstanceOf(Array);
    expect(result.actions.length).toBeGreaterThan(0);
  });

  test('should throw error for invalid data', async () => {
    await expect(dataGuard.makeCompliant(null, {}))
      .rejects
      .toThrow('Data must be a non-null object');
  });

  test('should handle different countries correctly', async () => {
    const testData = { email: 'test@example.com' };

    const usResult = await dataGuard.makeCompliant(testData, { country: 'US' });
    const deResult = await dataGuard.makeCompliant(testData, { country: 'DE' });
    const brResult = await dataGuard.makeCompliant(testData, { country: 'BR' });

    expect(usResult.compliance.applicableLaws).toContain('CCPA');
    expect(deResult.compliance.applicableLaws).toContain('GDPR');
    expect(brResult.compliance.applicableLaws).toContain('LGPD');
  });
});