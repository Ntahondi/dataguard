const { createDataGuard } = require('../../index');
const MongoDBIntegration = require('../../lib/integrations/mongodb');

async function demonstrateMongoDBIntegration() {
  console.log('🗄️ Testing DataGuard MongoDB Integration...\n');

  // Create DataGuard instance
  const dataGuard = createDataGuard({
    autoEncrypt: true,
    requireExplicitConsent: true
  });

  // Create MongoDB integration
  const mongoIntegration = new MongoDBIntegration(dataGuard, {
    url: process.env.MONGODB_URL || 'mongodb://localhost:27017',
    dbName: 'dataguard_demo'
  });

  try {
    console.log('1. 🔌 Testing MongoDB Connection');
    await mongoIntegration.initialize();
    console.log('✅ MongoDB connected successfully');

    console.log('\n2. 📝 Creating Compliant User Document');
    const userData = {
      email: 'john.doe@example.com',
      phone: '+1234567890',
      name: 'John Doe',
      birthdate: '1990-01-01',
      location: 'New York, NY',
      preferences: {
        newsletter: true,
        theme: 'dark'
      }
    };

    const createResult = await mongoIntegration.createCompliant(
      'users',
      userData,
      {
        country: 'US',
        action: 'registration',
        marketingConsent: true,
        analyticsConsent: true
      }
    );

    console.log('✅ User created with compliance metadata');
    console.log('   Document ID:', createResult.insertedId);
    console.log('   Laws applied:', createResult.compliance.applicableLaws.join(', '));
    console.log('   Encrypted fields:', createResult.compliance.actions.includes('sensitive_fields_encrypted'));

    console.log('\n3. 🔍 Finding Compliant Documents');
    const users = await mongoIntegration.findCompliant('users', {});
    console.log(`✅ Found ${users.length} users with compliance checks`);

    if (users.length > 0) {
      const user = users[0];
      console.log('   Compliance check:', user._complianceCheck.checkedAt);
      console.log('   Is compliant:', user._complianceCheck.isCompliant);
      console.log('   High-risk fields:', user._complianceCheck.classifications
        .filter(c => c.sensitivity === 'high' || c.sensitivity === 'critical')
        .map(c => c.field)
      );
    }

    console.log('\n4. 📊 Getting Compliance Statistics');
    const stats = await mongoIntegration.getComplianceStats();
    console.log('✅ Database compliance overview:');
    stats.collections.forEach(collection => {
      console.log(`   ${collection.name}: ${collection.compliancePercentage}% compliant`);
    });

    console.log('\n5. 🗑️ Testing User Deletion Request');
    const deletionResult = await mongoIntegration.handleUserDeletion(
      createResult.insertedId.toString(),
      'GDPR',
      { anonymize: true } // Anonymize instead of delete for demo
    );

    console.log('✅ Deletion request processed:');
    console.log('   Collections affected:', deletionResult.databaseOperations.length);
    console.log('   Actions:', deletionResult.actions.slice(0, 3).join(', '));

    console.log('\n6. 🏷️ Creating Compliance Indexes');
    await mongoIntegration.createComplianceIndexes();
    console.log('✅ Indexes created for compliance monitoring');

    console.log('\n🎯 MongoDB Integration Demo Complete!');
    console.log('💡 Key Features:');
    console.log('   • Automatic compliance for MongoDB operations');
    console.log('   • GDPR deletion request handling');
    console.log('   • Compliance statistics and monitoring');
    console.log('   • Anonymization instead of deletion for legal requirements');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.log('💡 Note: Make sure MongoDB is running or set MONGODB_URL environment variable');
  } finally {
    // Close connection
    if (mongoIntegration.initialized) {
      await mongoIntegration.close();
    }
  }
}

// Demo that works without actual MongoDB connection
async function demonstrateOffline() {
  console.log('\n🔌 Offline MongoDB Integration Demo\n');
  
  const dataGuard = createDataGuard();
  const mongoIntegration = new MongoDBIntegration(dataGuard);

  console.log('1. 📋 Integration methods available:');
  console.log('   • createCompliant(collection, data, context)');
  console.log('   • findCompliant(collection, query, options)');
  console.log('   • handleUserDeletion(userId, regulation, options)');
  console.log('   • getComplianceStats()');
  console.log('   • createComplianceIndexes()');

  console.log('\n2. 💡 Usage Example:');
  console.log(`
  const dataGuard = createDataGuard();
  const mongo = new MongoDBIntegration(dataGuard, {
    url: 'mongodb://localhost:27017',
    dbName: 'myapp'
  });

  // Create compliant user
  await mongo.createCompliant('users', userData, {
    country: 'US',
    action: 'registration'
  });

  // Handle GDPR deletion
  await mongo.handleUserDeletion('user123', 'GDPR', {
    anonymize: true
  });
  `);

  console.log('\n3. 🌍 Environment Variables:');
  console.log('   • MONGODB_URL - MongoDB connection string');
  console.log('   • MONGODB_DB_NAME - Database name');
}

if (require.main === module) {
  demonstrateMongoDBIntegration()
    .catch(() => demonstrateOffline());
}

module.exports = { demonstrateMongoDBIntegration, demonstrateOffline };