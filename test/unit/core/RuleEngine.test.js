const RuleEngine = require('../../../lib/core/RuleEngine');

describe('RuleEngine', () => {
  let ruleEngine;

  beforeEach(() => {
    ruleEngine = new RuleEngine({
      autoEncrypt: false
    });
  });

  test('should classify fields correctly', () => {
    const classifications = ruleEngine.classifyData({
      email: 'test@example.com',
      phone: '+1234567890',
      location: 'New York',
      interests: ['sports']
    });

    const emailClass = classifications.find(c => c.field === 'email');
    const interestsClass = classifications.find(c => c.field === 'interests');

    expect(emailClass.type).toBe('direct_identifier');
    expect(emailClass.sensitivity).toBe('high');
    expect(interestsClass.sensitivity).toBe('low');
  });

  test('should detect high-risk fields', () => {
    const data = {
      email: 'test@example.com',
      creditCard: '4111-1111-1111-1111',
      password: 'weak'
    };

    const warnings = ruleEngine.checkForWarnings(data);
    
    expect(warnings.some(w => w.level === 'high')).toBe(true);
    expect(warnings.some(w => w.field === 'password')).toBe(true);
  });

  test('should apply GDPR rules', async () => {
    const data = { email: 'test@example.com' };
    const result = await ruleEngine.process(data, { country: 'DE' });

    expect(result.data).toHaveProperty('_compliance');
    expect(result.compliance.applicableLaws).toContain('GDPR');
    // Updated expectation - the actual action name changed
    expect(result.compliance.actions).toContain('gdpr_consent_recorded');
  });

  test('should minimize excessive data', () => {
    const data = {
      email: 'test@example.com',
      socialSecurity: '123-45-6789', // Excessive data
      driversLicense: 'D1234567'
    };

    const hasExcessive = ruleEngine.hasExcessiveData(data);
    expect(hasExcessive).toBe(true);
  });

  test('should handle deletion requests', async () => {
    const result = await ruleEngine.handleDeletion('user123', 'GDPR');
    
    expect(result.actions).toBeInstanceOf(Array);
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.estimatedCompletion).toBe('30 days');
  });
});