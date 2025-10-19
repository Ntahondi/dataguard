const { makeCompliant, classifyData } = require('../../index');

async function demonstrateEncryption() {
  console.log('🔐 Testing DataGuard Encryption...\n');

  const sensitiveUserData = {
    email: 'john.doe@example.com',
    phone: '+1234567890',
    creditCard: '4111-1111-1111-1111',
    ssn: '123-45-6789',
    password: 'SuperSecurePassword123!',
    birthdate: '1990-01-01',
    location: 'New York, NY',
    preferences: {
      newsletter: true,
      theme: 'dark'
    }
  };

  try {
    console.log('📝 Original Data:');
    console.log(JSON.stringify(sensitiveUserData, null, 2));

    console.log('\n🔍 Classifying data without encryption...');
    const classifications = await classifyData(sensitiveUserData);
    classifications.forEach(c => {
      if (c.sensitivity === 'high' || c.sensitivity === 'critical') {
        console.log(`   🔒 ${c.field}: ${c.type} (${c.sensitivity}) - ${c.recommendation}`);
      }
    });

    console.log('\n🛡️ Making data compliant with encryption...');
    const result = await makeCompliant(sensitiveUserData, {
      country: 'US',
      action: 'registration',
      autoEncrypt: true
    });

    console.log('\n✅ Encrypted Data Structure:');
    const encryptedData = result.data;
    
    // Show encrypted fields
    Object.entries(encryptedData).forEach(([field, value]) => {
      if (value && typeof value === 'object' && value._encrypted) {
        console.log(`   🔐 ${field}: ENCRYPTED`);
        console.log(`      Algorithm: ${value.algorithm}`);
        console.log(`      Encrypted at: ${value.encryptedAt}`);
      } else if (field !== '_compliance') {
        console.log(`   📄 ${field}: ${JSON.stringify(value)}`);
      }
    });

    console.log('\n📊 Compliance Summary:');
    console.log(`   Processing time: ${result.processingTime}ms`);
    console.log(`   Actions taken: ${result.compliance.actions.join(', ')}`);
    console.log(`   Encrypted fields: ${result.compliance.actions.includes('sensitive_fields_encrypted') ? 'Yes' : 'No'}`);

    console.log('\n⚠️  Security Warnings:');
    result.warnings.forEach(warning => {
      const icon = warning.level === 'high' ? '🚨' : '⚠️';
      console.log(`   ${icon} [${warning.level}] ${warning.message}`);
    });

    // Demonstrate what happens with weak encryption key
    console.log('\n💡 Security Note:');
    console.log('   For production use, set DATAGUARD_ENCRYPTION_KEY environment variable');
    console.log('   Current key is temporary and should not be used in production!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testMultipleRegulations() {
  console.log('\n🌍 Testing Encryption Across Different Regulations\n');
  
  const regulations = [
    { country: 'US', name: 'United States (CCPA)' },
    { country: 'DE', name: 'Germany (GDPR)' },
    { country: 'BR', name: 'Brazil (LGPD)' },
    { country: 'JP', name: 'Japan (APPI)' }
  ];

  for (const reg of regulations) {
    const testData = {
      email: 'test@example.com',
      phone: '+1234567890',
      location: 'Test City'
    };

    try {
      const result = await makeCompliant(testData, {
        country: reg.country,
        action: 'user_profile_update'
      });

      const encryptedCount = Object.values(result.data).filter(
        value => value && typeof value === 'object' && value._encrypted
      ).length;

      console.log(`📍 ${reg.name}:`);
      console.log(`   📋 Laws: ${result.compliance.applicableLaws.join(', ')}`);
      console.log(`   🔐 Encrypted fields: ${encryptedCount}`);
      console.log(`   ⚡ Processing: ${result.processingTime}ms`);

    } catch (error) {
      console.log(`📍 ${reg.name}: Error - ${error.message}`);
    }
  }
}

if (require.main === module) {
  demonstrateEncryption()
    .then(() => testMultipleRegulations())
    .catch(console.error);
}

module.exports = { demonstrateEncryption, testMultipleRegulations };