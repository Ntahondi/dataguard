const ConsentManager = require('../../../lib/processors/ConsentManager');

describe('ConsentManager', () => {
  let consentManager;

  beforeEach(() => {
    consentManager = new ConsentManager({
      requireExplicitConsent: true
    });
  });

  test('should record consent correctly', () => {
    const userData = {};
    const consentOptions = {
      marketing: true,
      analytics: false, // This should be false
      purpose: 'registration'
    };

    const result = consentManager.recordConsent(userData, consentOptions, {
      ipAddress: '192.168.1.1',
      userAgent: 'test-agent'
    });

    expect(result._consent).toBeDefined();
    expect(result._consent.current.preferences.marketing).toBe(true);
    expect(result._consent.current.preferences.analytics).toBe(false); // Should be false
    expect(result._consent.current.purpose).toBe('registration');
  });

  test('should validate GDPR compliance', () => {
    const validConsent = {
      specific: true,
      informed: true,
      unambiguous: true,
      recordedAt: new Date().toISOString(),
      purpose: 'specific_purpose',
      canWithdraw: true
    };

    const invalidConsent = {
      specific: false,
      informed: false,
      unambiguous: false
    };

    expect(consentManager.isGdprCompliantConsent(validConsent)).toBe(true);
    expect(consentManager.isGdprCompliantConsent(invalidConsent)).toBe(false);
    expect(consentManager.isGdprCompliantConsent(null)).toBe(false);
  });

  test('should check consent validity', () => {
    const userData = {
      _consent: {
        current: {
          specific: true,
          informed: true,
          unambiguous: true,
          recordedAt: new Date().toISOString(),
          purpose: 'registration',
          canWithdraw: true,
          preferences: {
            marketing: true,
            analytics: true,
            necessary: true,
            personalization: false,
            thirdPartySharing: false,
            internationalTransfer: false
          }
        }
      }
    };

    expect(consentManager.hasValidConsent(userData, 'marketing')).toBe(true);
    expect(consentManager.hasValidConsent(userData, 'analytics')).toBe(true);
    expect(consentManager.hasValidConsent(userData, 'necessary')).toBe(true);
    expect(consentManager.hasValidConsent(userData, 'third_party_sharing')).toBe(false);
  });

  test('should withdraw consent', () => {
    const userData = {
      _consent: {
        current: {
          preferences: {
            marketing: true,
            analytics: true
          },
          recordedAt: new Date().toISOString()
        }
      }
    };

    const result = consentManager.withdrawConsent(userData, 'marketing', {
      ipAddress: '192.168.1.1'
    });

    expect(result._consent.current.preferences.marketing).toBe(false);
    expect(result._consent.current.preferences.analytics).toBe(true);
    expect(result._consent.withdrawals).toHaveLength(1);
  });

  test('should generate consent text', () => {
    const marketingTemplate = consentManager.generateConsentText('marketing');
    const necessaryTemplate = consentManager.generateConsentText('necessary');

    expect(marketingTemplate.title).toBe('Marketing Communications');
    expect(necessaryTemplate.required).toBe(true);
  });
});