const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testExpressEndpoints() {
  console.log('🧪 Testing DataGuard Express Endpoints...\n');

  try {
    console.log('1. 📋 Testing /register endpoint (auto-compliance)');
    const registrationData = {
      email: 'alice@example.com',
      phone: '+1234567890',
      name: 'Alice Smith',
      birthdate: '1990-01-01',
      location: 'New York, NY',
      password: 'SuperSecurePassword123!'
    };

    const registerResponse = await axios.post(`${BASE_URL}/register`, registrationData, {
      headers: {
        'x-consent-marketing': 'true',
        'x-consent-analytics': 'true'
      }
    });

    console.log('✅ Registration successful:');
    console.log('   User ID:', registerResponse.data.user.id);
    console.log('   Compliance laws:', registerResponse.data.compliance.applicableLaws);
    console.log('   Processing time:', registerResponse.data.compliance.processingTime);

    // Check response headers
    console.log('   Response headers:');
    console.log('     X-DataGuard-Processed:', registerResponse.headers['x-dataguard-processed']);
    console.log('     X-DataGuard-Laws:', registerResponse.headers['x-dataguard-laws']);

    console.log('\n2. 🛡️ Testing /profile endpoint (GDPR required)');
    const profileData = {
      name: 'Alice Johnson', // Married name change
      location: 'Los Angeles, CA',
      preferences: {
        newsletter: true,
        theme: 'light'
      }
    };

    const profileResponse = await axios.post(`${BASE_URL}/profile`, profileData);
    console.log('✅ Profile update successful');
    console.log('   Updated fields:', profileResponse.data.updatedFields);

    console.log('\n3. 📧 Testing /marketing endpoint (consent required)');
    try {
      const marketingData = { message: 'Special offer!' };
      const marketingResponse = await axios.post(`${BASE_URL}/marketing`, marketingData);
      console.log('✅ Marketing communication sent');
    } catch (error) {
      console.log('❌ Marketing failed (expected without consent):', error.response?.data?.message);
    }

    console.log('\n4. 🔧 Testing /manual-compliance endpoint');
    const manualData = {
      ssn: '123-45-6789',
      creditCard: '4111-1111-1111-1111',
      personalInfo: {
        income: 75000,
        employment: 'Software Engineer'
      }
    };

    const manualResponse = await axios.post(`${BASE_URL}/manual-compliance`, manualData);
    console.log('✅ Manual compliance successful');
    console.log('   Original data fields:', Object.keys(manualResponse.data.original));
    console.log('   Compliant data fields:', Object.keys(manualResponse.data.compliant));
    console.log('   High-risk classifications:', 
      manualResponse.data.compliance.classifications
        .filter(c => c.sensitivity === 'high' || c.sensitivity === 'critical')
        .map(c => c.field)
    );

    console.log('\n5. ℹ️ Testing /compliance-info endpoint');
    const infoResponse = await axios.get(`${BASE_URL}/compliance-info`);
    console.log('✅ Compliance info retrieved');
    console.log('   Headers sent:', infoResponse.data.headers);

    console.log('\n🎯 All Express endpoint tests completed successfully!');
    console.log('\n💡 Key DataGuard Express Features:');
    console.log('   • Automatic request body compliance');
    console.log('   • GDPR compliance enforcement');
    console.log('   • Consent validation middleware');
    console.log('   • Compliance headers in responses');
    console.log('   • Manual compliance when needed');

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Express server not running. Start it with: npm run demo:express');
    } else {
      console.error('❌ Test failed:', error.response?.data || error.message);
    }
  }
}

// Test without server running
async function demonstrateOffline() {
  console.log('🔌 Express Middleware Features (Offline Demo)\n');
  
  console.log('1. 📋 Middleware Setup:');
  console.log(`
  const express = require('express');
  const { dataGuardMiddleware } = require('dataguard/web/express');
  
  const app = express();
  app.use(express.json());
  app.use(dataGuardMiddleware({
    autoEncrypt: true,
    requireExplicitConsent: true
  }));
  `);

  console.log('\n2. 🛡️ Route Protection:');
  console.log(`
  // GDPR compliance required
  app.post('/profile', requireGDPRCompliance(), (req, res) => {
    // req.body is automatically GDPR compliant
    res.json({ success: true });
  });
  
  // Consent validation required
  app.post('/marketing', validateConsent(['marketing']), (req, res) => {
    // Only reaches here if valid marketing consent exists
    res.json({ success: true });
  });
  `);

  console.log('\n3. 📊 Response Headers:');
  console.log('   • X-DataGuard-Processed: true');
  console.log('   • X-DataGuard-Laws: GDPR,CCPA');
  console.log('   • X-DataGuard-Processing-Time: 45ms');
  console.log('   • X-DataGuard-Warnings-Count: 2');

  console.log('\n4. 🌍 Context Detection:');
  console.log('   • Country from headers (CF-IPCountry, Accept-Language)');
  console.log('   • IP address for audit trails');
  console.log('   • User agent for context');
  console.log('   • Consent from custom headers');
}

if (require.main === module) {
  testExpressEndpoints()
    .catch(() => demonstrateOffline());
}

module.exports = { testExpressEndpoints, demonstrateOffline };