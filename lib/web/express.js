const DataGuard = require('../core/DataGuard');

/**
 * Express middleware for automatic request body compliance
 */
function dataGuardMiddleware(options = {}) {
  const dataGuard = new DataGuard(options);
  let initialized = false;

  return async (req, res, next) => {
    try {
      // Lazy initialization
      if (!initialized) {
        await dataGuard.initialize();
        initialized = true;
      }

      // Store dataGuard instance in request for manual use
      req.dataGuard = dataGuard;

      // Skip if no body or already processed
      if (!req.body || Object.keys(req.body).length === 0 || req._dataguardProcessed) {
        return next();
      }

      // Determine context from request
      const context = {
        action: `${req.method.toLowerCase()}_${req.path.replace(/\//g, '_')}`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        country: detectCountryFromRequest(req),
        source: 'express_middleware',
        timestamp: new Date().toISOString()
      };

      // Add consent from headers or body
      if (req.headers['x-consent-marketing']) {
        context.marketingConsent = req.headers['x-consent-marketing'] === 'true';
      }
      if (req.headers['x-consent-analytics']) {
        context.analyticsConsent = req.headers['x-consent-analytics'] === 'true';
      }

      // Make request body compliant
      const complianceResult = await dataGuard.makeCompliant(req.body, context);

      // Replace request body with compliant data
      req.body = complianceResult.data;
      
      // Store compliance info for response
      req.compliance = {
        processed: true,
        processingTime: complianceResult.processingTime,
        applicableLaws: complianceResult.compliance.applicableLaws,
        warnings: complianceResult.warnings
      };

      // Mark as processed to avoid double processing
      req._dataguardProcessed = true;

      console.log(`✅ Express middleware processed ${req.method} ${req.path}`);
      
      next();
    } catch (error) {
      console.error('❌ Express middleware error:', error.message);
      
      // Continue without compliance processing
      req.compliance = {
        processed: false,
        error: error.message
      };
      
      next();
    }
  };
}

/**
 * Response middleware to add compliance headers
 */
function dataGuardResponseMiddleware(options = {}) {
  return (req, res, next) => {
    // Store original send function
    const originalSend = res.send;

    res.send = function(data) {
      // Add compliance headers if processing occurred
      if (req.compliance && req.compliance.processed) {
        res.set({
          'X-DataGuard-Processed': 'true',
          'X-DataGuard-Laws': req.compliance.applicableLaws.join(','),
          'X-DataGuard-Processing-Time': req.compliance.processingTime || 'unknown'
        });

        // Add warnings header if any
        if (req.compliance.warnings && req.compliance.warnings.length > 0) {
          res.set('X-DataGuard-Warnings-Count', req.compliance.warnings.length.toString());
        }
      }

      // Call original send
      originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Route-specific compliance enforcement
 */
function requireCompliance(requiredLaws = []) {
  return (req, res, next) => {
    if (!req.compliance || !req.compliance.processed) {
      return res.status(400).json({
        error: 'Compliance processing required',
        message: 'This endpoint requires data compliance processing'
      });
    }

    if (requiredLaws.length > 0) {
      const missingLaws = requiredLaws.filter(law => 
        !req.compliance.applicableLaws.includes(law)
      );

      if (missingLaws.length > 0) {
        return res.status(400).json({
          error: 'Insufficient compliance',
          message: `Required laws not met: ${missingLaws.join(', ')}`,
          required: requiredLaws,
          actual: req.compliance.applicableLaws
        });
      }
    }

    next();
  };
}

/**
 * GDPR-specific compliance enforcement
 */
function requireGDPRCompliance() {
  return requireCompliance(['GDPR']);
}

/**
 * Consent validation middleware
 */
function validateConsent(requiredConsentTypes = []) {
  return async (req, res, next) => {
    try {
      if (!req.dataGuard) {
        throw new Error('DataGuard not initialized');
      }

      const ConsentManager = require('../processors/ConsentManager');
      const consentManager = new ConsentManager();

      for (const consentType of requiredConsentTypes) {
        const hasConsent = consentManager.hasValidConsent(req.body, consentType);
        
        if (!hasConsent) {
          return res.status(403).json({
            error: 'Consent required',
            message: `Valid consent required for: ${consentType}`,
            requiredConsent: consentType
          });
        }
      }

      next();
    } catch (error) {
      console.error('Consent validation error:', error.message);
      res.status(500).json({
        error: 'Consent validation failed',
        message: error.message
      });
    }
  };
}

/**
 * Detect country from request (simplified)
 */
function detectCountryFromRequest(req) {
  // Check headers first
  const countryHeader = req.get('CF-IPCountry') || req.get('X-Country-Code');
  if (countryHeader) return countryHeader;

  // Check accepted languages
  const acceptLanguage = req.get('Accept-Language');
  if (acceptLanguage) {
    const countryMatch = acceptLanguage.match(/-([A-Z]{2})/);
    if (countryMatch) return countryMatch[1];
  }

  // Default to US
  return 'US';
}

/**
 * Error handler for compliance-related errors
 */
function dataGuardErrorHandler() {
  return (error, req, res, next) => {
    if (error.message.includes('compliance') || error.message.includes('consent')) {
      console.error('Compliance error:', error.message);
      
      return res.status(400).json({
        error: 'Compliance processing failed',
        message: error.message,
        type: 'compliance_error'
      });
    }
    
    next(error);
  };
}

module.exports = {
  dataGuardMiddleware,
  dataGuardResponseMiddleware,
  requireCompliance,
  requireGDPRCompliance,
  validateConsent,
  dataGuardErrorHandler
};