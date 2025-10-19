# DataGuard 🛡️ Documentation

**Universal Privacy Compliance for Developers - GDPR, CCPA, LGPD Made Simple**

## 📖 Table of Contents
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
- [Framework Integrations](#framework-integrations)
- [Database Integrations](#database-integrations)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### Installation
```bash
npm install dataguards
```

### 30-Second Setup
```javascript
const { makeCompliant } = require('dataguard');

// Make any data compliant with one line
const userData = {
  email: 'john@example.com',
  phone: '+1234567890',
  birthdate: '1990-01-01'
};

const compliantData = await makeCompliant(userData, {
  country: 'US',
  action: 'registration'
});

console.log(compliantData);
// Output: Same data but with automatic privacy protection
```

### Express.js Setup (2 lines)
```javascript
const express = require('express');
const { dataGuardMiddleware } = require('dataguard/web/express');

const app = express();
app.use(express.json());
app.use(dataGuardMiddleware()); // That's it! All requests now auto-compliant
```

## 🎯 Core Concepts

### What DataGuard Does
DataGuard is your **"Compliance Co-pilot"** that automatically:

1. **🔍 Detects Privacy Risks** - Finds sensitive data in your objects
2. **🛡️ Applies Protection** - Encrypts, classifies, and secures data
3. **📝 Manages Consent** - Tracks user permissions automatically
4. **🌍 Handles Regulations** - Applies GDPR, CCPA, LGPD rules based on user location
5. **📊 Creates Audit Trails** - Maintains compliance records

### How It Works
```javascript
// INPUT: Your regular data
const userData = {
  email: 'test@example.com',
  phone: '+1234567890'
};

// PROCESS: DataGuard automatically
const result = await makeCompliant(userData);

// OUTPUT: Protected, compliant data
{
  email: { _encrypted: true, ... }, // Auto-encrypted
  phone: { _encrypted: true, ... }, // Auto-encrypted  
  _compliance: { /* Automatic compliance metadata */ },
  _consent: { /* Automatic consent tracking */ }
}
```

## 📚 API Reference

### Core Methods

#### `makeCompliant(data, context)`
Makes any data compliant with privacy laws.

**Parameters:**
- `data` (Object): Your user data, request body, or any object
- `context` (Object): Processing context (optional)
  - `country` (String): User's country code ('US', 'DE', 'BR', etc.)
  - `action` (String): What you're doing with the data ('registration', 'profile_update', etc.)
  - `ipAddress` (String): User's IP for audit trails
  - `userAgent` (String): User's browser/device info

**Returns:**
```javascript
{
  success: true,
  data: { /* Your compliant data */ },
  compliance: {
    applicableLaws: ['GDPR', 'CCPA'],
    processingTime: 45,
    actions: ['encrypted_fields', 'consent_recorded']
  },
  warnings: [] // Any privacy issues found
}
```

**Example:**
```javascript
const userData = {
  email: 'alice@example.com',
  phone: '+1234567890',
  location: 'New York'
};

const result = await makeCompliant(userData, {
  country: 'DE', // Germany - applies GDPR
  action: 'registration',
  ipAddress: '192.168.1.100'
});

// result.data now has:
// - Encrypted email and phone
// - GDPR consent records
// - Compliance metadata
```

#### `handleDeletionRequest(userId, regulation)`
Handles user data deletion requests (GDPR "Right to Erasure").

**Parameters:**
- `userId` (String): User identifier
- `regulation` (String): Privacy law ('GDPR', 'CCPA', etc.)

**Example:**
```javascript
const result = await handleDeletionRequest('user123', 'GDPR');
// Automatically finds and anonymizes/deletes user data across your systems
```

#### `classifyData(data)`
Analyzes and classifies data fields by sensitivity.

**Example:**
```javascript
const classifications = await classifyData({
  email: 'test@example.com',
  birthdate: '1990-01-01',
  interests: ['sports']
});

// Returns:
[
  { field: 'email', type: 'pii', sensitivity: 'high' },
  { field: 'birthdate', type: 'demographic', sensitivity: 'medium' },
  { field: 'interests', type: 'behavioral', sensitivity: 'low' }
]
```

### Advanced Usage

#### Custom Configuration
```javascript
const { createDataGuard } = require('dataguard');

const dataGuard = createDataGuard({
  autoEncrypt: true,           // Auto-encrypt sensitive fields
  requireExplicitConsent: true, // Require explicit user consent
  strictMode: true,            // Strict compliance enforcement
  logLevel: 'info'             // Logging level
});

// Use your configured instance
const result = await dataGuard.makeCompliant(userData);
```

#### Environment Variables
```bash
# Set encryption key for production
DATAGUARD_ENCRYPTION_KEY=your-32-byte-encryption-key-here

# MongoDB integration
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=your-database

# MySQL integration  
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=your-database
```

## 🔌 Framework Integrations

### Express.js Middleware
**Automatic request body compliance:**
```javascript
const express = require('express');
const { 
  dataGuardMiddleware,
  requireGDPRCompliance,
  validateConsent 
} = require('dataguard/web/express');

const app = express();
app.use(express.json());

// Add automatic compliance to all routes
app.use(dataGuardMiddleware());

// Your routes now get auto-compliant request bodies
app.post('/register', (req, res) => {
  // req.body is already compliant!
  const user = new User(req.body);
  await user.save();
  res.json({ success: true });
});

// GDPR-protected routes
app.post('/profile', requireGDPRCompliance(), (req, res) => {
  // Only reaches here if GDPR compliance is met
  res.json({ success: true });
});

// Consent-required routes
app.post('/marketing', validateConsent(['marketing']), (req, res) => {
  // Only reaches here with valid marketing consent
  res.json({ success: true });
});
```

### Response Headers
DataGuard adds compliance headers to responses:
```http
X-DataGuard-Processed: true
X-DataGuard-Laws: GDPR,CCPA
X-DataGuard-Processing-Time: 45ms
X-DataGuard-Warnings-Count: 0
```

## 🗄️ Database Integrations

### MongoDB
```javascript
const { createDataGuard } = require('dataguard');
const { MongoDBIntegration } = require('dataguard/integrations/mongodb');

const dataGuard = createDataGuard();
const mongo = new MongoDBIntegration(dataGuard, {
  url: 'mongodb://localhost:27017',
  dbName: 'myapp'
});

// Create compliant documents
await mongo.createCompliant('users', userData, {
  country: 'US',
  action: 'registration'
});

// Find with compliance checking
const users = await mongo.findCompliant('users', { status: 'active' });

// Handle GDPR deletion
await mongo.handleUserDeletion('user123', 'GDPR', {
  anonymize: true // Keep analytics, remove personal info
});
```

### MySQL
```javascript
const { MySQLIntegration } = require('dataguard/integrations/mysql');

const mysql = new MySQLIntegration(dataGuard, {
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'myapp'
});

// Create compliant records
await mysql.createCompliant('users', userData, {
  country: 'US'
});

// Setup compliance tables
await mysql.setupComplianceTables();
```

## 🏆 Best Practices

### 1. Always Provide Context
```javascript
// ✅ GOOD - Provides context for better compliance
await makeCompliant(userData, {
  country: getUserCountry(req),
  action: 'registration',
  ipAddress: req.ip
});

// ❌ BAD - Missing context
await makeCompliant(userData);
```

### 2. Use Framework Integrations
```javascript
// ✅ GOOD - Let middleware handle compliance
app.use(dataGuardMiddleware());

// ❌ BAD - Manual compliance in every route
app.post('/register', async (req, res) => {
  const compliantData = await makeCompliant(req.body);
  // ... more code
});
```

### 3. Handle Consent Properly
```javascript
// Send consent headers from frontend
fetch('/api/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Consent-Marketing': 'true',
    'X-Consent-Analytics': 'false'
  },
  body: JSON.stringify(userData)
});
```

### 4. Production Security
```bash
# ✅ Set encryption key in production
DATAGUARD_ENCRYPTION_KEY=your-secure-key-here

# ✅ Use environment-specific configs
NODE_ENV=production
```

## 📋 Examples

### Basic Registration Flow
```javascript
const { makeCompliant } = require('dataguard');

async function registerUser(userData, context) {
  // 1. Make data compliant
  const compliantData = await makeCompliant(userData, context);
  
  // 2. Save to database (data already protected)
  const user = await User.create(compliantData.data);
  
  // 3. Return response with compliance info
  return {
    user: {
      id: user.id,
      email: user.email, // Already encrypted if sensitive
      profile: user.profileName
    },
    compliance: compliantData.compliance
  };
}
```

### E-commerce Checkout
```javascript
app.post('/checkout', dataGuardMiddleware(), async (req, res) => {
  // req.body is automatically compliant
  const order = await Order.create({
    ...req.body,
    userId: req.user.id
  });
  
  // Compliance info available if needed
  console.log('Applied laws:', req.compliance.applicableLaws);
  
  res.json({ 
    success: true, 
    orderId: order.id,
    compliance: req.compliance 
  });
});
```

### User Data Export (GDPR)
```javascript
app.get('/user/:id/export', async (req, res) => {
  const classifications = await classifyData(userData);
  
  res.json({
    user: userData,
    dataClassification: classifications,
    compliance: {
      applicableLaws: ['GDPR'],
      processedAt: new Date().toISOString()
    }
  });
});
```

## 🐛 Troubleshooting

### Common Issues

**1. "Encryption key not set" warning**
```bash
# Solution: Set environment variable
DATAGUARD_ENCRYPTION_KEY=your-32-byte-key-here
```

**2. "MongoDB connection failed"**
```javascript
// Solution: Check connection settings
const mongo = new MongoDBIntegration(dataGuard, {
  url: process.env.MONGODB_URL || 'mongodb://localhost:27017',
  dbName: 'your-db-name'
});
```

**3. "Consent validation failed"**
```javascript
// Solution: Send consent headers
headers: {
  'X-Consent-Marketing': 'true',
  'X-Consent-Analytics': 'true'
}
```

**4. Slow processing**
```javascript
// Solution: Disable features if needed
const dataGuard = createDataGuard({
  autoEncrypt: false, // Disable encryption for development
  strictMode: false   // Relax compliance rules
});
```

### Debug Mode
```javascript
const dataGuard = createDataGuard({
  logLevel: 'debug' // See detailed processing info
});

// Check what DataGuard is doing
const result = await dataGuard.makeCompliant(userData);
console.log('Actions taken:', result.compliance.actions);
console.log('Warnings:', result.warnings);
```

## 🔍 Understanding Output

### Compliant Data Structure
```javascript
{
  // Your original data (protected)
  email: { 
    _encrypted: true,
    algorithm: 'aes-256-gcm',
    data: 'encrypted-data-here',
    // ... encryption metadata
  },
  
  // Automatic compliance metadata
  _compliance: {
    processedAt: '2024-01-15T10:30:00.000Z',
    applicableLaws: ['GDPR', 'CCPA'],
    processingTime: 45
  },
  
  // Automatic consent tracking
  _consent: {
    current: {
      recordedAt: '2024-01-15T10:30:00.000Z',
      preferences: {
        marketing: true,
        analytics: true
      }
    }
  }
}
```

## 🚀 Production Checklist

- [ ] Set `DATAGUARD_ENCRYPTION_KEY` environment variable
- [ ] Configure database connections
- [ ] Test with different country codes
- [ ] Verify consent flows work
- [ ] Check compliance headers in responses
- [ ] Monitor processing performance
- [ ] Set up error handling for compliance failures

## 💡 Pro Tips

1. **Use in Development**: Catch privacy issues early
2. **Test Edge Cases**: Different countries, missing consent, large data
3. **Monitor Compliance**: Use the audit trails for reporting
4. **Educate Team**: Show how DataGuard simplifies compliance
5. **Stay Updated**: DataGuard handles new regulations automatically

## 📞 Support

- **Documentation**: Continue exploring this guide
- **Examples**: Check `/examples` directory in package
- **Testing**: Run `npm test` to verify your setup
- **Issues**: Check test output for common solutions

---

**DataGuard makes privacy compliance as easy as:**
```javascript
const compliant = await makeCompliant(yourData);
```

No lawyers, no complex code, no compliance headaches! 🎉