const { makeCompliant, handleDeletionRequest } = require('../../index');

async function testBasicUsage() {
  console.log('🧪 Testing Enhanced DataGuard...\n');

  const userData = {
    email: 'john.doe@example.com',
    phone: '+1234567890',
    birthdate: '1990-01-01',
    location: 'New York, NY',
    password: 'weakpass',
    interests: ['technology', 'sports'],
    gps: { lat: 40.7128, lng: -74.0060 }
  };

  try {
    console.log('📝 Testing data compliance...');
    const result = await makeCompliant(userData, {
      country: 'US',
      action: 'registration'
    });

    console.log('✅ Compliance Processing Complete!');
    console.log(`📊 Processing time: ${result.processingTime}ms`);
    console.log(`🏛️ Applicable laws: ${result.compliance.applicableLaws.join(', ')}`);
    console.log(`🔍 Data rights: ${result.compliance.dataRights.length} rights enabled`);
    console.log(`⚡ Actions taken: ${result.compliance.actions.join(', ')}`);
    
    console.log('\n📋 Data Classifications:');
    result.data._compliance.classifications.forEach(classification => {
      console.log(`   ${classification.field}: ${classification.type} (${classification.sensitivity})`);
    });

    console.log('\n⚠️  Warnings:');
    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        console.log(`   [${warning.level}] ${warning.message}`);
      });
    } else {
      console.log('   No warnings detected');
    }

    console.log('\n🛡️ Testing deletion request...');
    const deletionResult = await handleDeletionRequest('user123', 'GDPR');
    console.log(`🗑️ Deletion actions: ${deletionResult.actions.length} steps required`);
    console.log(`⏱️ Estimated completion: ${deletionResult.estimatedCompletion}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testDifferentRegions() {
  console.log('\n🌍 Testing Regional Compliance...\n');
  
  const testCases = [
    { country: 'US', region: 'California' },
    { country: 'BR', region: 'Brazil' },
    { country: 'CA', region: 'Canada' },
    { country: 'DE', region: 'Germany' }
  ];

  for (const testCase of testCases) {
    const userData = {
      email: 'test@example.com',
      phone: '+1234567890'
    };

    try {
      const result = await makeCompliant(userData, {
        country: testCase.country,
        action: 'registration'
      });

      console.log(`📍 ${testCase.region}:`);
      console.log(`   Laws: ${result.compliance.applicableLaws.join(', ')}`);
      console.log(`   Rights: ${result.compliance.dataRights.length} enabled`);
    } catch (error) {
      console.log(`📍 ${testCase.region}: Error - ${error.message}`);
    }
  }
}

if (require.main === module) {
  testBasicUsage()
    .then(() => testDifferentRegions())
    .catch(console.error);
}

module.exports = { testBasicUsage, testDifferentRegions };