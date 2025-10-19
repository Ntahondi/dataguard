const ConfigManager = require('./ConfigManager');
/**
 * Enhanced Rule-based compliance engine with GDPR implementation
 */
class RuleEngine {
  constructor(config) {
    this.config = config;
    this.configManager = new ConfigManager(config);
    this.config = this.configManager.config;
    this.regionalManager = null;
    this.fieldClassifications = this.loadFieldClassifications();
    this.encryptor = new (require('../processors/DataEncryptor'))(this.config);
    this.consentManager = new (require('../processors/ConsentManager'))(this.config);
  }

  async process(data, context = {}) {
    const startTime = Date.now();
    
    // Determine applicable laws based on context
    const applicableLaws = await this.determineApplicableLaws(context);
    const complianceMeta = {
      processedAt: new Date(),
      applicableLaws,
      actions: [],
      dataRights: this.getDataRights(applicableLaws)
    };

    let processedData = { ...data };
    
    // Apply compliance rules for each applicable law
    for (const law of applicableLaws) {
      const lawResult = await this.applyLaw(processedData, law, context);
      processedData = lawResult.data;
      complianceMeta.actions.push(...lawResult.actions);
    }

    // Classify all data fields
    const classifications = this.classifyData(processedData);
    
    // Auto-encrypt sensitive fields
    if (this.config.autoEncrypt !== false) {
      processedData = this.encryptor.autoEncryptSensitiveFields(processedData, classifications);
      if (processedData !== data) {
        complianceMeta.actions.push('sensitive_fields_encrypted');
      }
    }

    // Add compliance metadata
    Object.defineProperty(processedData, '_compliance', {
      value: {
        ...complianceMeta,
        classifications,
        processingTime: Date.now() - startTime
      },
      enumerable: false,
      configurable: true
    });

    const warnings = this.checkForWarnings(processedData);

    return {
      data: processedData,
      compliance: complianceMeta,
      warnings,
      processingTime: Date.now() - startTime
    };
  }

async applyLaw(data, law, context) {
  const actions = [];
  let processedData = { ...data };

  switch (law) {
    case 'GDPR':
      // GDPR Article 6 - Lawful basis and consent
      if (!processedData._consent) {
        processedData = this.consentManager.recordConsent(
          processedData, 
          {
            purpose: context.action || 'general_processing',
            marketing: context.marketingConsent || false,
            analytics: context.analyticsConsent !== false, // Default true
            personalization: context.personalizationConsent || false
          },
          {
            ipAddress: context.ipAddress,
            userAgent: context.userAgent
          }
        );
        actions.push('gdpr_consent_recorded');
      }

      // GDPR Article 5 - Data minimization
      if (this.hasExcessiveData(data)) {
        processedData = this.minimizeData(processedData, context);
        actions.push('gdpr_data_minimization_applied');
      }

      // GDPR Article 17 - Right to erasure preparation
      if (!processedData._deletionMetadata) {
        processedData._deletionMetadata = {
          canBeDeleted: this.canBeDeleted(processedData),
          retentionPeriod: this.calculateRetentionPeriod(processedData),
          deletionProcedure: 'anonymize_sensitive_keep_anonymous',
          consentWithdrawalImpact: 'stop_processing_immediately'
        };
        actions.push('gdpr_deletion_metadata_added');
      }
      break;

    case 'CCPA':
      // CCPA - Right to opt-out
      if (!processedData._ccpaRights) {
        processedData._ccpaRights = {
          optOutOfSale: true, // Default to protective stance
          verified: false,
          lastUpdated: new Date(),
          method: 'user_request'
        };
        actions.push('ccpa_rights_metadata_added');
      }
      break;
  }

  return { data: processedData, actions };
}

  async determineApplicableLaws(context) {
    const laws = ['GDPR']; // Default to strictest
    
    // Simple region-based law detection
    if (context.country) {
      const country = context.country.toUpperCase();
      
      if (country === 'US' || country === 'CA') {
        laws.push('CCPA');
      }
      
      if (country === 'BR') {
        laws.push('LGPD');
      }
      
      if (country === 'CA') {
        laws.push('PIPEDA');
      }
    }

    return [...new Set(laws)]; // Remove duplicates
  }

  getDataRights(laws) {
    const rights = [];
    
    laws.forEach(law => {
      switch (law) {
        case 'GDPR':
          rights.push(
            'right_to_access',
            'right_to_rectification', 
            'right_to_erasure',
            'right_to_restrict_processing',
            'right_to_data_portability',
            'right_to_object'
          );
          break;
        case 'CCPA':
          rights.push(
            'right_to_know',
            'right_to_delete', 
            'right_to_opt_out',
            'right_to_non_discrimination'
          );
          break;
      }
    });
    
    return [...new Set(rights)];
  }

  classifyData(data) {
    const classifications = [];
    
    for (const [field, value] of Object.entries(data)) {
      if (value === undefined || value === null) continue;
      
      const classification = this.classifyField(field, value, data);
      classifications.push({
        field,
        value: this.maskSensitiveValue(field, value),
        type: classification.type,
        sensitivity: classification.sensitivity,
        laws: classification.laws,
        recommendation: classification.recommendation,
        encryptionRequired: classification.encryptionRequired,
        retentionDays: classification.retentionDays
      });
    }
    
    return classifications;
  }

  classifyField(fieldName, value, fullData = {}) {
    const classification = this.fieldClassifications[fieldName] || 
      this.inferClassification(fieldName, value, fullData);
    
    return classification;
  }

  loadFieldClassifications() {
    return {
      // Direct identifiers
      email: { 
        type: 'direct_identifier', 
        sensitivity: 'high', 
        laws: ['GDPR', 'CCPA', 'LGPD'],
        recommendation: 'encrypt_at_rest',
        encryptionRequired: true,
        retentionDays: 365
      },
      phone: { 
        type: 'direct_identifier', 
        sensitivity: 'high', 
        laws: ['GDPR', 'CCPA'],
        recommendation: 'encrypt_at_rest',
        encryptionRequired: true,
        retentionDays: 365
      },
      phoneNumber: { 
        type: 'direct_identifier', 
        sensitivity: 'high', 
        laws: ['GDPR', 'CCPA'],
        recommendation: 'encrypt_at_rest',
        encryptionRequired: true,
        retentionDays: 365
      },
      
      // Demographic data
      birthdate: { 
        type: 'demographic', 
        sensitivity: 'medium', 
        laws: ['GDPR', 'COPPA'],
        recommendation: 'store_age_range_instead',
        encryptionRequired: false,
        retentionDays: 365
      },
      age: { 
        type: 'demographic', 
        sensitivity: 'low', 
        laws: ['GDPR'],
        recommendation: 'store_age_range',
        encryptionRequired: false,
        retentionDays: 365
      },
      
      // Location data
      location: { 
        type: 'geolocation', 
        sensitivity: 'high', 
        laws: ['GDPR'],
        recommendation: 'store_region_instead_of_precise',
        encryptionRequired: true,
        retentionDays: 90
      },
      gps: { 
        type: 'geolocation', 
        sensitivity: 'high', 
        laws: ['GDPR'],
        recommendation: 'avoid_storage_use_ephemeral',
        encryptionRequired: true,
        retentionDays: 7
      },
      
      // Financial data
      creditCard: { 
        type: 'financial', 
        sensitivity: 'critical', 
        laws: ['GDPR', 'PCI_DSS'],
        recommendation: 'never_store_use_tokenization',
        encryptionRequired: true,
        retentionDays: 0 // Don't store!
      },
      
      // Credentials
      password: { 
        type: 'credential', 
        sensitivity: 'critical', 
        laws: ['GDPR'],
        recommendation: 'hash_with_salt',
        encryptionRequired: true,
        retentionDays: 0 // Should be hashed, not stored
      },
      
      // Behavioral data
      interests: { 
        type: 'behavioral', 
        sensitivity: 'low', 
        laws: ['GDPR'],
        recommendation: 'anonymous_aggregation_ok',
        encryptionRequired: false,
        retentionDays: 730
      },
      preferences: { 
        type: 'behavioral', 
        sensitivity: 'low', 
        laws: ['GDPR'],
        recommendation: 'can_be_stored_anonymously',
        encryptionRequired: false,
        retentionDays: 730
      }
    };
  }

  inferClassification(fieldName, value, fullData) {
    // Intelligent inference based on field name patterns and values
    const lowerField = fieldName.toLowerCase();
    
    if (lowerField.includes('email')) {
      return { type: 'direct_identifier', sensitivity: 'high', laws: ['GDPR', 'CCPA'] };
    }
    
    if (lowerField.includes('phone') || lowerField.includes('mobile')) {
      return { type: 'direct_identifier', sensitivity: 'high', laws: ['GDPR', 'CCPA'] };
    }
    
    if (lowerField.includes('birth') || lowerField.includes('dob')) {
      return { type: 'demographic', sensitivity: 'medium', laws: ['GDPR'] };
    }
    
    if (lowerField.includes('location') || lowerField.includes('gps') || lowerField.includes('coord')) {
      return { type: 'geolocation', sensitivity: 'high', laws: ['GDPR'] };
    }
    
    if (lowerField.includes('pass') || lowerField.includes('pwd')) {
      return { type: 'credential', sensitivity: 'critical', laws: ['GDPR'] };
    }
    
    // Default classification
    return { 
      type: 'general', 
      sensitivity: 'low', 
      laws: ['GDPR'],
      recommendation: 'standard_handling',
      encryptionRequired: false,
      retentionDays: 365
    };
  }

  maskSensitiveValue(fieldName, value) {
    const sensitiveFields = ['email', 'phone', 'phoneNumber', 'password', 'creditCard'];
    
    if (sensitiveFields.includes(fieldName) && typeof value === 'string') {
      if (fieldName === 'email') {
        const [user, domain] = value.split('@');
        return `${user.substring(0, 2)}***@${domain}`;
      }
      if (fieldName === 'phone' || fieldName === 'phoneNumber') {
        return value.replace(/\d(?=\d{4})/g, '*');
      }
      if (fieldName === 'password') {
        return '********';
      }
    }
    
    return value;
  }

  hasExcessiveData(data) {
    // Check if we're collecting more data than necessary for basic operations
    const excessiveFields = ['socialSecurity', 'driversLicense', 'passportNumber'];
    return excessiveFields.some(field => field in data);
  }

  minimizeData(data, context) {
    const minimized = { ...data };
    
    // Remove unnecessary fields based on context
    if (context.action === 'registration') {
      // For registration, we don't need precise location
      if (minimized.gps) {
        delete minimized.gps;
      }
    }
    
    return minimized;
  }

  canBeDeleted(data) {
    // Check if data can be fully deleted or needs anonymization
    const criticalFields = ['email', 'phone', 'userId'];
    return !criticalFields.some(field => field in data);
  }

  calculateRetentionPeriod(data) {
    // Calculate retention based on most sensitive field
    const classifications = this.classifyData(data);
    const maxRetention = Math.max(...classifications.map(c => c.retentionDays || 365));
    return maxRetention;
  }

  checkForWarnings(data) {
    const warnings = [];
    
    // Check for weak passwords
    if (data.password && data.password.length < 12) {
      warnings.push({
        level: 'high',
        message: 'Password is too weak (minimum 12 characters recommended)',
        field: 'password',
        recommendation: 'enforce_stronger_password_policy'
      });
    }
    
    // Check for missing consent
    if (!data._complianceConsent) {
      warnings.push({
        level: 'medium', 
        message: 'No explicit consent recorded for data processing',
        field: '_complianceConsent',
        recommendation: 'capture_explicit_consent_with_timestamp'
      });
    }
    
    // Check for excessive personal data
    const piiCount = this.classifyData(data).filter(c => 
      c.sensitivity === 'high' || c.sensitivity === 'critical'
    ).length;
    
    if (piiCount > 3) {
      warnings.push({
        level: 'medium',
        message: `Collecting ${piiCount} high-sensitivity fields - consider data minimization`,
        recommendation: 'review_data_collection_practices'
      });
    }
    
    return warnings;
  }

  // Add this method to the RuleEngine class if it doesn't exist
  async handleDeletion(userId, regulation) {
    const actions = [
      'verify_user_identity',
      'identify_all_data_locations',
      'assess_legal_retention_requirements'
    ];

    switch (regulation) {
      case 'GDPR':
        actions.push(
          'anonymize_personal_data',
          'retain_anonymous_transactions_7_years',
          'notify_third_parties_of_deletion',
          'provide_deletion_confirmation'
        );
        break;
      case 'CCPA':
        actions.push(
          'delete_personal_information', 
          'maintain_service_after_deletion',
          'verify_deletion_completion',
          'provide_verification_method'
        );
        break;
    }

    return {
      actions,
      estimatedCompletion: '30 days',
      userNotificationRequired: true,
      legalReviewRequired: regulation === 'GDPR'
    };
  }
}

module.exports = RuleEngine;