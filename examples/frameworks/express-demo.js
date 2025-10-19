const express = require('express');
const { 
  dataGuardMiddleware, 
  dataGuardResponseMiddleware,
  requireGDPRCompliance,
  validateConsent,
  dataGuardErrorHandler
} = require('../../lib/web/express');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(dataGuardMiddleware({
  autoEncrypt: true,
  requireExplicitConsent: true
}));
app.use(dataGuardResponseMiddleware());
app.use(dataGuardErrorHandler());

console.log('🚀 Starting Express Server with DataGuard Middleware...\n');

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'DataGuard Express Demo',
    endpoints: [
      'POST /register - User registration with auto-compliance',
      'POST /profile - Update profile (GDPR compliance required)',
      'POST /marketing - Marketing endpoint (consent required)',
      'GET /compliance-info - Check request compliance info'
    ]
  });
});

// User registration - automatic compliance
app.post('/register', (req, res) => {
  console.log('📝 Registration endpoint - Compliant data received:');
  console.log('   Body:', JSON.stringify(req.body, null, 2));
  
  // Data is already compliant thanks to middleware!
  const userData = req.body;

  res.json({
    success: true,
    message: 'User registered successfully',
    user: {
      id: 'user_' + Date.now(),
      email: userData.email, // Already encrypted if sensitive
      profile: userData.profileName
    },
    compliance: req.compliance
  });
});

// Profile update - GDPR compliance required
app.post('/profile', requireGDPRCompliance(), (req, res) => {
  console.log('👤 Profile update - GDPR compliant data:');
  
  res.json({
    success: true,
    message: 'Profile updated with GDPR compliance',
    updatedFields: Object.keys(req.body),
    compliance: req.compliance
  });
});

// Marketing endpoint - consent validation required
app.post('/marketing', 
  validateConsent(['marketing']), 
  (req, res) => {
    console.log('📧 Marketing endpoint - Valid consent confirmed');
    
    res.json({
      success: true,
      message: 'Marketing communication sent',
      consentValid: true
    });
  }
);

// Check compliance information
app.get('/compliance-info', (req, res) => {
  res.json({
    compliance: req.compliance || { processed: false },
    headers: {
      'x-consent-marketing': req.get('x-consent-marketing'),
      'x-consent-analytics': req.get('x-consent-analytics')
    }
  });
});

// Manual compliance endpoint
app.post('/manual-compliance', async (req, res) => {
  try {
    // Use DataGuard manually from request
    if (!req.dataGuard) {
      throw new Error('DataGuard not available in request');
    }

    const compliantData = await req.dataGuard.makeCompliant(req.body, {
      action: 'manual_processing',
      country: 'US'
    });

    // Extract high-risk classifications safely
    const highRiskClassifications = compliantData.compliance && compliantData.compliance.classifications 
      ? compliantData.compliance.classifications.filter(c => 
          c.sensitivity === 'high' || c.sensitivity === 'critical'
        ).map(c => c.field)
      : [];

    res.json({
      success: true,
      original: {
        email: req.body.email,
        phone: req.body.phone,
        ssn: req.body.ssn,
        creditCard: req.body.creditCard,
        personalInfo: req.body.personalInfo
      },
      compliant: {
        email: compliantData.data.email,
        phone: compliantData.data.phone,
        ssn: compliantData.data.ssn,
        creditCard: compliantData.data.creditCard,
        personalInfo: compliantData.data.personalInfo,
        // Show that compliance metadata was added
        hasComplianceMetadata: !!compliantData.data._compliance,
        isEncrypted: compliantData.data.email && typeof compliantData.data.email === 'object' && compliantData.data.email._encrypted
      },
      compliance: {
        processingTime: compliantData.processingTime,
        applicableLaws: compliantData.compliance.applicableLaws,
        highRiskClassifications: highRiskClassifications,
        warnings: compliantData.warnings
      }
    });
  } catch (error) {
    res.status(400).json({
      error: 'Manual compliance failed',
      message: error.message
    });
  }
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ Express server running on http://localhost:${PORT}`);
    console.log('\n📋 Available endpoints:');
    console.log('   POST http://localhost:3000/register');
    console.log('   POST http://localhost:3000/profile');
    console.log('   POST http://localhost:3000/marketing');
    console.log('   GET  http://localhost:3000/compliance-info');
    console.log('   POST http://localhost:3000/manual-compliance');
    
    console.log('\n🎯 Demo ready! Test with:');
    console.log('   curl -X POST http://localhost:3000/register \\');
    console.log('        -H "Content-Type: application/json" \\');
    console.log('        -d \'{"email":"test@example.com","phone":"+1234567890","name":"Test User"}\'');
    
    console.log('\n💡 Try different consent headers:');
    console.log('   -H "x-consent-marketing: true"');
    console.log('   -H "x-consent-analytics: false"');
  });
}

module.exports = app;