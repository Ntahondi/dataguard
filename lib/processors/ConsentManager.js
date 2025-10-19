/**
 * Comprehensive consent management for GDPR Article 7 and other regulations
 */
class ConsentManager {
  constructor(config = {}) {
    this.config = {
      requireExplicitConsent: true,
      recordConsentTimestamps: true,
      trackConsentHistory: true,
      allowGranularConsent: true,
      defaultConsentVersion: '1.0',
      ...config
    };
  }

  /**
   * Record user consent for data processing
   */
  recordConsent(userData, consentOptions = {}, context = {}) {
    const consentRecord = {
      // Basic consent information
      version: this.config.defaultConsentVersion,
      recordedAt: new Date().toISOString(),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      
      // GDPR Article 7 requirements
      lawfulBasis: 'consent',
      purpose: consentOptions.purpose || 'general_processing',
      specific: consentOptions.specific !== false, // Must be specific
      informed: consentOptions.informed !== false, // Must be informed
      unambiguous: consentOptions.unambiguous !== false, // Must be unambiguous
      
      // Granular consent preferences
      preferences: {
        necessary: true, // Always true for necessary operations
        marketing: consentOptions.marketing || false,
        analytics: consentOptions.analytics !== undefined ? consentOptions.analytics : true,
        personalization: consentOptions.personalization || false,
        thirdPartySharing: consentOptions.thirdPartySharing || false,
        internationalTransfer: consentOptions.internationalTransfer || false
      },
      
      // Legal metadata
      regulation: 'GDPR', // Default to strictest
      article: 'Article_7',
      requiresExplicitAction: true,
      
      // Withdrawal information
      canWithdraw: true,
      withdrawalMethod: 'same_as_consent_method',
      withdrawalRecorded: false
    };

    // Add to user data
    if (!userData._consent) {
      userData._consent = {
        current: consentRecord,
        history: []
      };
    } else {
      // Move current to history and update
      userData._consent.history.push(userData._consent.current);
      userData._consent.current = consentRecord;
    }

    return userData;
  }

  /**
   * Withdraw consent (GDPR Article 7(3))
   */
  withdrawConsent(userData, consentType = 'all', context = {}) {
    if (!userData._consent) {
      throw new Error('No consent records found for user');
    }

    const withdrawalRecord = {
      withdrawnAt: new Date().toISOString(),
      withdrawnConsentType: consentType,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      previousConsent: { ...userData._consent.current }
    };

    // Update current consent based on withdrawal type
    if (consentType === 'all') {
      // Withdraw all consent
      userData._consent.current.preferences = {
        necessary: true, // Necessary cookies/processing cannot be withdrawn
        marketing: false,
        analytics: false,
        personalization: false,
        thirdPartySharing: false,
        internationalTransfer: false
      };
      userData._consent.current.withdrawn = true;
    } else {
      // Withdraw specific consent type
      userData._consent.current.preferences[consentType] = false;
    }

    // Record withdrawal
    userData._consent.current.withdrawalRecorded = true;
    userData._consent.current.lastWithdrawal = withdrawalRecord;

    // Add to withdrawal history
    if (!userData._consent.withdrawals) {
      userData._consent.withdrawals = [];
    }
    userData._consent.withdrawals.push(withdrawalRecord);

    return userData;
  }

  /**
   * Check if valid consent exists for specific processing
   */
  hasValidConsent(userData, processingType, options = {}) {
    if (!userData._consent || !userData._consent.current) {
      return false;
    }

    const consent = userData._consent.current;

    // Check if consent meets GDPR requirements
    if (!this.isGdprCompliantConsent(consent)) {
      return false;
    }

    // Check for specific processing type
    switch (processingType) {
      case 'necessary':
        return true; // Necessary processing is always allowed

      case 'marketing':
        return consent.preferences.marketing === true;

      case 'analytics':
        return consent.preferences.analytics === true;

      case 'personalization':
        return consent.preferences.personalization === true;

      case 'third_party_sharing':
        return consent.preferences.thirdPartySharing === true;

      case 'international_transfer':
        return consent.preferences.internationalTransfer === true;

      default:
        // For custom processing types, check if consent exists
        return consent.preferences[processingType] === true;
    }
  }

  /**
   * Validate consent against GDPR Article 7 requirements
   */
  isGdprCompliantConsent(consent) {
    if (!consent) return false;

    return (
      consent.specific === true &&
      consent.informed === true &&
      consent.unambiguous === true &&
      consent.recordedAt && // Must have timestamp
      consent.purpose && // Must have specific purpose
      consent.canWithdraw === true // Must be able to withdraw
    );
  }

  /**
   * Get consent audit trail for compliance reporting
   */
  getConsentAuditTrail(userData) {
    if (!userData._consent) {
      return {
        hasConsent: false,
        message: 'No consent records found'
      };
    }

    const audit = {
      hasConsent: true,
      currentConsent: userData._consent.current,
      consentHistory: userData._consent.history || [],
      withdrawals: userData._consent.withdrawals || [],
      summary: this.generateConsentSummary(userData._consent)
    };

    return audit;
  }

  /**
   * Generate human-readable consent summary
   */
  generateConsentSummary(consentData) {
    const current = consentData.current;
    const historyCount = consentData.history ? consentData.history.length : 0;
    const withdrawalCount = consentData.withdrawals ? consentData.withdrawals.length : 0;

    return {
      consentGiven: current.recordedAt,
      purposes: current.purpose,
      preferences: current.preferences,
      history: {
        totalConsentChanges: historyCount,
        totalWithdrawals: withdrawalCount,
        lastChange: historyCount > 0 ? consentData.history[historyCount - 1].recordedAt : null
      },
      compliance: {
        gdprCompliant: this.isGdprCompliantConsent(current),
        canWithdraw: current.canWithdraw,
        isInformed: current.informed
      }
    };
  }

  /**
   * Auto-detect consent from context (for implicit consent scenarios)
   */
  detectImplicitConsent(context = {}) {
    // This is for scenarios where consent might be implied but not explicit
    // Use with caution - explicit consent is always preferred for GDPR
    
    const implicitConsent = {
      version: this.config.defaultConsentVersion,
      recordedAt: new Date().toISOString(),
      lawfulBasis: 'legitimate_interest', // Different lawful basis
      purpose: 'essential_operations',
      specific: false, // Implicit consent is not specific
      informed: false, // Implicit consent is not informed
      unambiguous: false, // Implicit consent is not unambiguous
      detectedFrom: context.source || 'implicit',
      requiresExplicitConfirmation: true // Flag for follow-up
    };

    return implicitConsent;
  }

  /**
   * Generate consent text for UI/display purposes
   */
  generateConsentText(consentType, options = {}) {
    const consentTemplates = {
      marketing: {
        title: 'Marketing Communications',
        text: 'I agree to receive marketing communications and promotional materials via email and SMS.',
        required: false,
        lawfulBasis: 'consent'
      },
      analytics: {
        title: 'Analytics Cookies',
        text: 'I agree to the use of analytics cookies to help improve the website experience.',
        required: false,
        lawfulBasis: 'consent'
      },
      necessary: {
        title: 'Necessary Cookies',
        text: 'These cookies are necessary for the website to function and cannot be switched off.',
        required: true,
        lawfulBasis: 'contract'
      },
      personalization: {
        title: 'Personalization',
        text: 'I agree to the processing of my data for personalization purposes.',
        required: false,
        lawfulBasis: 'consent'
      }
    };

    return consentTemplates[consentType] || {
      title: 'Data Processing',
      text: 'I agree to the processing of my personal data for the specified purpose.',
      required: false,
      lawfulBasis: 'consent'
    };
  }
}

module.exports = ConsentManager;