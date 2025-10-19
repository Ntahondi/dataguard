const fs = require('fs');
const path = require('path');

class ProjectStructure {
  constructor(basePath = '.') {
    this.basePath = basePath;
  }

  createDirectory(dirPath) {
    const fullPath = path.join(this.basePath, dirPath);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Created: ${dirPath}`);
    }
  }

  createFile(filePath, content = '') {
    const fullPath = path.join(this.basePath, filePath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, content);
      console.log(`📄 Created: ${filePath}`);
    }
  }

  createCoreFiles() {
    console.log('\n🚀 Creating DataGuard Project Structure...\n');

    // Create all directories
    const directories = [
      // Core structure
      'lib/core',
      'lib/compliance',
      'lib/processors',
      'lib/storage',
      'lib/storage/utils',
      'lib/integrations',
      'lib/web',
      'lib/patterns',
      'lib/utils',
      
      // Types
      'types/core',
      'types/compliance',
      'types/storage',
      
      // Examples
      'examples/vanilla-js',
      'examples/databases',
      'examples/frameworks',
      'examples/advanced',
      
      // Tests
      'test/unit/core',
      'test/unit/compliance',
      'test/unit/processors',
      'test/unit/storage',
      'test/integration/databases',
      'test/integration/frameworks',
      'test/integration/performance',
      'test/fixtures',
      'test/utils',
      
      // Docs
      'docs/database-guides',
      'docs/framework-guides',
      'docs/migration-guides',
      
      // Scripts & Config
      'scripts',
      'config',
      
      // Distribution
      'dist'
    ];

    directories.forEach(dir => this.createDirectory(dir));

    // Create core files with basic content
    this.createCoreSourceFiles();
    this.createConfigFiles();
    this.createExampleFiles();
    this.createTestFiles();
    this.createDocFiles();
    
    console.log('\n✅ Project structure created successfully!');
    console.log('🎉 You can now start developing DataGuard!');
  }

  createCoreSourceFiles() {
    console.log('\n📦 Creating core source files...');

    // Main entry point
    this.createFile('index.js', `const DataGuard = require('./lib/core/DataGuard');

// Create default instance
let defaultInstance = null;

function createDataGuard(config = {}) {
  return new DataGuard(config);
}

function getDefaultInstance() {
  if (!defaultInstance) {
    defaultInstance = createDataGuard();
  }
  return defaultInstance;
}

// Main exports
module.exports = DataGuard;
module.exports.createDataGuard = createDataGuard;
module.exports.getDefaultInstance = getDefaultInstance;

// Quick start helper
module.exports.makeCompliant = async (data, context) => {
  const instance = getDefaultInstance();
  return await instance.makeCompliant(data, context);
};
`);

    // Core DataGuard class
    this.createFile('lib/core/DataGuard.js', `/**
 * Main DataGuard class - Database agnostic core
 */
class DataGuard {
  constructor(config = {}) {
    this.config = this.initializeConfig(config);
    this.ruleEngine = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    const RuleEngine = require('./RuleEngine');
    this.ruleEngine = new RuleEngine(this.config);
    
    this.initialized = true;
  }

  async makeCompliant(data, context = {}) {
    await this.initialize();
    
    if (!data || typeof data !== 'object') {
      throw new Error('Data must be a non-null object');
    }

    try {
      const result = await this.ruleEngine.process(data, context);
      return {
        success: true,
        data: result.data,
        compliance: result.compliance,
        warnings: result.warnings || []
      };
    } catch (error) {
      throw this.handleError(error, 'makeCompliant');
    }
  }

  async handleDeletionRequest(userId, regulation = 'GDPR') {
    await this.initialize();
    return await this.ruleEngine.handleDeletion(userId, regulation);
  }

  async classifyData(data) {
    await this.initialize();
    return await this.ruleEngine.classifyData(data);
  }

  initializeConfig(userConfig) {
    const defaults = {
      env: process.env.NODE_ENV || 'development',
      strictMode: true,
      autoEncrypt: true
    };
    return { ...defaults, ...userConfig };
  }

  handleError(error, method) {
    console.error(\`DataGuard Error in \${method}:\`, error.message);
    return error;
  }
}

module.exports = DataGuard;
`);

    // Rule Engine
    this.createFile('lib/core/RuleEngine.js', `/**
 * Rule-based compliance engine
 */
class RuleEngine {
  constructor(config) {
    this.config = config;
  }

  async process(data, context) {
    const complianceMeta = {
      processedAt: new Date(),
      applicableLaws: ['GDPR'],
      actions: ['basic_compliance_check']
    };

    const processedData = { ...data };
    const classifications = this.classifyData(processedData);
    
    processedData._compliance = {
      ...complianceMeta,
      classifications
    };

    return {
      data: processedData,
      compliance: complianceMeta,
      warnings: this.checkForWarnings(processedData)
    };
  }

  async handleDeletion(userId, regulation) {
    return {
      actions: [
        'flag_user_for_deletion',
        'schedule_data_anonymization'
      ],
      estimatedCompletion: '30 days'
    };
  }

  classifyData(data) {
    const classifications = [];
    for (const [field, value] of Object.entries(data)) {
      if (value === undefined || value === null) continue;
      const classification = this.classifyField(field, value);
      classifications.push({
        field,
        type: classification.type,
        sensitivity: classification.sensitivity
      });
    }
    return classifications;
  }

  classifyField(fieldName, value) {
    const rules = {
      email: { type: 'pii', sensitivity: 'high' },
      phone: { type: 'pii', sensitivity: 'high' },
      phoneNumber: { type: 'pii', sensitivity: 'high' },
      birthdate: { type: 'demographic', sensitivity: 'medium' },
      location: { type: 'geolocation', sensitivity: 'high' },
      password: { type: 'credential', sensitivity: 'critical' }
    };
    return rules[fieldName] || { type: 'general', sensitivity: 'low' };
  }

  checkForWarnings(data) {
    const warnings = [];
    if (data.password && data.password.length < 8) {
      warnings.push('Weak password detected');
    }
    return warnings;
  }
}

module.exports = RuleEngine;
`);

    // Additional core files (placeholders)
    this.createFile('lib/core/ConfigManager.js', '// Configuration manager - TODO: Implement');
    this.createFile('lib/core/Validator.js', '// Input validation - TODO: Implement');

    // Compliance files
    this.createFile('lib/compliance/BaseLaw.js', '// Base law class - TODO: Implement');
    this.createFile('lib/compliance/GDPR.js', '// GDPR implementation - TODO: Implement');
    this.createFile('lib/compliance/CCPA.js', '// CCPA implementation - TODO: Implement');
    this.createFile('lib/compliance/LGPD.js', '// LGPD implementation - TODO: Implement');
    this.createFile('lib/compliance/PIPEDA.js', '// PIPEDA implementation - TODO: Implement');
    this.createFile('lib/compliance/APPIA.js', '// APPIA implementation - TODO: Implement');
    this.createFile('lib/compliance/PDPA.js', '// PDPA implementation - TODO: Implement');
    this.createFile('lib/compliance/RegionalManager.js', '// Regional manager - TODO: Implement');

    // Processors
    this.createFile('lib/processors/DataClassifier.js', '// Data classifier - TODO: Implement');
    this.createFile('lib/processors/DataAnonymizer.js', '// Data anonymizer - TODO: Implement');
    this.createFile('lib/processors/DataEncryptor.js', '// Data encryptor - TODO: Implement');
    this.createFile('lib/processors/RetentionManager.js', '// Retention manager - TODO: Implement');
    this.createFile('lib/processors/ConsentManager.js', '// Consent manager - TODO: Implement');

    // Storage
    this.createFile('lib/storage/StorageAdapter.js', '// Storage adapter - TODO: Implement');
    this.createFile('lib/storage/MemoryStorage.js', '// Memory storage - TODO: Implement');
    this.createFile('lib/storage/FileStorage.js', '// File storage - TODO: Implement');
    this.createFile('lib/storage/RedisStorage.js', '// Redis storage - TODO: Implement');
    this.createFile('lib/storage/utils/QueryBuilder.js', '// Query builder - TODO: Implement');
    this.createFile('lib/storage/utils/MigrationHelper.js', '// Migration helper - TODO: Implement');

    // Utils
    this.createFile('lib/utils/helpers.js', '// Helper functions - TODO: Implement');
    this.createFile('lib/utils/constants.js', '// Constants - TODO: Implement');
    this.createFile('lib/utils/error-handler.js', '// Error handler - TODO: Implement');
    this.createFile('lib/utils/performance.js', '// Performance monitoring - TODO: Implement');
  }

  createConfigFiles() {
    console.log('\n⚙️ Creating configuration files...');

    // Package.json
    this.createFile('package.json', `{
  "name": "dataguard",
  "version": "1.0.0-alpha.1",
  "description": "Universal privacy compliance for developers - GDPR, CCPA, LGPD made simple",
  "main": "index.js",
  "types": "types/index.d.ts",
  "scripts": {
    "dev": "node examples/vanilla-js/basic-usage.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "build": "node scripts/build.js",
    "lint": "eslint lib/ test/ examples/",
    "format": "prettier --write ."
  },
  "keywords": [
    "privacy",
    "compliance",
    "gdpr",
    "ccpa",
    "lgpd",
    "data-protection",
    "automation"
  ],
  "author": "DataGuard Team",
  "license": "MIT",
  "engines": {
    "node": ">=14.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
`);

    // README
    this.createFile('README.md', `# DataGuard 🛡️

Universal privacy compliance for developers - GDPR, CCPA, LGPD made simple.

## Quick Start

\`\`\`bash
npm install dataguard
\`\`\`

\`\`\`javascript
const { makeCompliant } = require('dataguard');

const userData = {
  email: 'john@example.com',
  phone: '+1234567890',
  birthdate: '1990-01-01'
};

const compliantData = await makeCompliant(userData, {
  country: 'US',
  action: 'registration'
});
\`\`\`

## Features

- ✅ Automatic GDPR, CCPA, LGPD compliance
- ✅ Database agnostic
- ✅ One-line compliance: \`makeCompliant(data)\`
- ✅ Automatic data classification
- ✅ Consent management
- ✅ Data deletion handling

## License

MIT
`);

    // LICENSE
    this.createFile('LICENSE', `MIT License

Copyright (c) 2024 DataGuard Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`);

    // Config files
    this.createFile('config/default-config.js', '// Default configuration - TODO: Implement');
    this.createFile('config/field-classifications.js', '// Field classifications - TODO: Implement');
    this.createFile('config/retention-policies.js', '// Retention policies - TODO: Implement');
    this.createFile('config/law-definitions.js', '// Law definitions - TODO: Implement');
  }

  createExampleFiles() {
    console.log('\n📚 Creating example files...');

    // Basic usage example
    this.createFile('examples/vanilla-js/basic-usage.js', `const { makeCompliant } = require('../../index');

async function main() {
  console.log('🧪 Testing DataGuard Basic Usage...\\n');

  const userData = {
    email: 'john.doe@example.com',
    phone: '+1234567890',
    birthdate: '1990-01-01',
    location: 'New York, NY',
    interests: ['technology', 'sports']
  };

  try {
    const result = await makeCompliant(userData, {
      country: 'US',
      action: 'registration'
    });

    console.log('✅ Success! Compliant data created.');
    console.log('Data classifications:', result.data._compliance.classifications);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = main;
`);

    // Placeholder example files
    this.createFile('examples/vanilla-js/object-compliance.js', '// Object compliance example - TODO: Implement');
    this.createFile('examples/vanilla-js/file-storage.js', '// File storage example - TODO: Implement');
    
    this.createFile('examples/databases/mysql-example.js', '// MySQL example - TODO: Implement');
    this.createFile('examples/databases/postgres-example.js', '// PostgreSQL example - TODO: Implement');
    this.createFile('examples/databases/mongodb-example.js', '// MongoDB example - TODO: Implement');
    this.createFile('examples/databases/sqlite-example.js', '// SQLite example - TODO: Implement');
    this.createFile('examples/databases/firestore-example.js', '// Firestore example - TODO: Implement');
    
    this.createFile('examples/frameworks/express-app.js', '// Express example - TODO: Implement');
    this.createFile('examples/frameworks/fastify-app.js', '// Fastify example - TODO: Implement');
    this.createFile('examples/frameworks/react-app.js', '// React example - TODO: Implement');
    this.createFile('examples/frameworks/vue-app.js', '// Vue example - TODO: Implement');
    
    this.createFile('examples/advanced/multi-tenant.js', '// Multi-tenant example - TODO: Implement');
    this.createFile('examples/advanced/custom-laws.js', '// Custom laws example - TODO: Implement');
    this.createFile('examples/advanced/performance-test.js', '// Performance test - TODO: Implement');
  }

  createTestFiles() {
    console.log('\n🧪 Creating test files...');

    // Basic test files
    this.createFile('test/unit/core/DataGuard.test.js', `const DataGuard = require('../../../lib/core/DataGuard');

describe('DataGuard Core', () => {
  let dataGuard;

  beforeEach(() => {
    dataGuard = new DataGuard();
  });

  test('should initialize correctly', async () => {
    await dataGuard.initialize();
    expect(dataGuard.initialized).toBe(true);
  });

  test('should classify data fields', async () => {
    const data = { email: 'test@example.com', phone: '1234567890' };
    const classifications = await dataGuard.classifyData(data);
    expect(classifications.length).toBeGreaterThan(0);
  });
});
`);

    this.createFile('test/fixtures/user-data.js', '// Test user data - TODO: Implement');
    this.createFile('test/fixtures/compliance-scenarios.js', '// Compliance scenarios - TODO: Implement');
    this.createFile('test/fixtures/edge-cases.js', '// Edge cases - TODO: Implement');
    
    this.createFile('test/utils/test-helpers.js', '// Test helpers - TODO: Implement');
    this.createFile('test/utils/mock-storage.js', '// Mock storage - TODO: Implement');
  }

  createDocFiles() {
    console.log('\n📖 Creating documentation files...');

    this.createFile('docs/getting-started.md', '# Getting Started\n\nQuick start guide for DataGuard.');
    this.createFile('docs/api-reference.md', '# API Reference\n\nComplete API documentation.');
    this.createFile('docs/compliance-laws.md', '# Compliance Laws\n\nSupported privacy laws and regulations.');
    this.createFile('docs/database-guides/mongodb.md', '# MongoDB Guide\n\nUsing DataGuard with MongoDB.');
    this.createFile('docs/framework-guides/express.md', '# Express Guide\n\nUsing DataGuard with Express.js.');
    this.createFile('docs/migration-guides/v1-to-v2.md', '# Migration Guide\n\nVersion migration instructions.');
  }
}

// Run the script
if (require.main === module) {
  const project = new ProjectStructure();
  project.createCoreFiles();
}

module.exports = ProjectStructure;