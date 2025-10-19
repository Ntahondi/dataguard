const { makeCompliant, createDataGuard } = require('../../index');

async function demonstrateConsentManagement() {
  console.log('📝 Testing DataGuard Consent Management...\n');

  // Create a custom instance for consent testing
  const dataGuard = createDataGuard({
    requireExplicitConsent: true,
    trackConsentHistory: true
  });

  const userData = {
    email: 'alice@example.com',
    name: 'Alice Smith',
    preferences: {
      language: 'en',
      timezone: 'UTC'
    }
  };

  try {
    console.log('1. 📋 Initial Registration with Consent');
    const registrationResult = await dataGuard.makeCompliant(userData, {
      country: 'DE',
      action: 'registration',
      marketingConsent: true,
      analyticsConsent: true,
      personalizationConsent: false,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    console.log('✅ Registration completed with consent:');
    console.log('   Consent recorded:', registrationResult.data._consent.current.recordedAt);
    console.log('   Marketing consent:', registrationResult.data._consent.current.preferences.marketing);
    console.log('   Analytics consent:', registrationResult.data._consent.current.preferences.analytics);
    console.log('   Personalization consent:', registrationResult.data._consent.current.preferences.personalization);

    console.log('\n2. 🔍 Checking Consent Validity');
    const ConsentManager = require('../../lib/processors/ConsentManager');
    const consentManager = new ConsentManager();
    
    const checks = [
      { type: 'marketing', description: 'Marketing emails' },
      { type: 'analytics', description: 'Analytics tracking' },
      { type: 'personalization', description: 'Personalized content' },
      { type: 'necessary', description: 'Necessary operations' }
    ];

    checks.forEach(check => {
      const hasConsent = consentManager.hasValidConsent(
        registrationResult.data, 
        check.type
      );
      console.log(`   ${hasConsent ? '✅' : '❌'} ${check.description}: ${hasConsent ? 'Allowed' : 'Not allowed'}`);
    });

    console.log('\n3. 🚫 Testing Consent Withdrawal');
    
    // Withdraw marketing consent
    const afterWithdrawal = consentManager.withdrawConsent(
      registrationResult.data,
      'marketing',
      {
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    );

    console.log('✅ Marketing consent withdrawn');
    console.log('   Marketing consent now:', afterWithdrawal._consent.current.preferences.marketing);
    console.log('   Withdrawal recorded:', afterWithdrawal._consent.withdrawals.length > 0);

    console.log('\n4. 📊 Consent Audit Trail');
    const audit = consentManager.getConsentAuditTrail(afterWithdrawal);
    console.log('   Total consent changes:', audit.consentHistory.length);
    console.log('   Total withdrawals:', audit.withdrawals.length);
    console.log('   GDPR compliant:', audit.summary.compliance.gdprCompliant);

    console.log('\n5. 🌍 Testing Different Consent Scenarios');

    const scenarios = [
      {
        country: 'US',
        consent: { marketing: true, analytics: true },
        description: 'US with full consent'
      },
      {
        country: 'DE', 
        consent: { marketing: false, analytics: true },
        description: 'Germany (GDPR) with minimal consent'
      },
      {
        country: 'BR',
        consent: { marketing: false, analytics: false, thirdPartySharing: false },
        description: 'Brazil (LGPD) with no optional consent'
      }
    ];

    for (const scenario of scenarios) {
      const testData = { email: 'test@example.com', name: 'Test User' };
      
      const result = await dataGuard.makeCompliant(testData, {
        country: scenario.country,
        action: 'registration',
        ...scenario.consent
      });

      const consent = result.data._consent.current.preferences;
      const activeConsents = Object.entries(consent)
        .filter(([key, value]) => value === true && key !== 'necessary')
        .map(([key]) => key);

      console.log(`   📍 ${scenario.description}`);
      console.log(`      Active consents: ${activeConsents.length > 0 ? activeConsents.join(', ') : 'none'}`);
      console.log(`      Laws applied: ${result.compliance.applicableLaws.join(', ')}`);
    }

    console.log('\n6. ⚠️  Testing Invalid Consent Scenarios');
    
    // Test without explicit consent
    const noConsentData = { email: 'bob@example.com' };
    const noConsentResult = await dataGuard.makeCompliant(noConsentData, {
      country: 'DE',
      action: 'registration'
      // No consent options provided
    });

    const consentCheck = consentManager.hasValidConsent(noConsentResult.data, 'marketing');
    console.log(`   Marketing without explicit consent: ${consentCheck ? '✅ Allowed' : '❌ Not allowed'}`);

    console.log('\n🎯 Consent Management Demo Complete!');
    console.log('💡 Key GDPR Compliance Features:');
    console.log('   • Explicit consent recording with timestamps');
    console.log('   • Granular consent preferences');
    console.log('   • Consent withdrawal tracking');
    console.log('   • Audit trails for compliance reporting');
    console.log('   • Lawful basis documentation');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testConsentTemplates() {
  console.log('\n📄 Testing Consent Text Generation\n');
  
  const ConsentManager = require('../../lib/processors/ConsentManager');
  const consentManager = new ConsentManager();

  const consentTypes = ['marketing', 'analytics', 'necessary', 'personalization'];

  consentTypes.forEach(type => {
    const template = consentManager.generateConsentText(type);
    console.log(`📋 ${template.title}:`);
    console.log(`   ${template.text}`);
    console.log(`   Required: ${template.required ? 'Yes' : 'No'}`);
    console.log(`   Lawful Basis: ${template.lawfulBasis}`);
    console.log('');
  });
}

if (require.main === module) {
  demonstrateConsentManagement()
    .then(() => testConsentTemplates())
    .catch(console.error);
}

module.exports = { demonstrateConsentManagement, testConsentTemplates };