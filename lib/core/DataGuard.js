/**
 * Main DataGuard class - Database agnostic core
 */
class DataGuard {
  constructor(config = {}) {
    this.config = this.initializeConfig(config);
    this.ruleEngine = null;
    this.initialized = false;
  }

  /**
   * Initialize DataGuard (lazy initialization)
   */
  async initialize() {
    if (this.initialized) return;

    const RuleEngine = require('./RuleEngine');
    this.ruleEngine = new RuleEngine(this.config);
    
    this.initialized = true;
    console.log('✅ DataGuard initialized successfully');
  }

  /**
   * Main method - Make any data compliant with one call
   */
  async makeCompliant(data, context = {}) {
    await this.initialize();
    
    if (!data || typeof data !== 'object') {
      throw new Error('Data must be a non-null object');
    }

    const startTime = Date.now();
    
    try {
      const result = await this.ruleEngine.process(data, context);
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: result.data,
        compliance: result.compliance,
        processingTime: processingTime,
        warnings: result.warnings || []
      };
    } catch (error) {
      throw this.handleError(error, 'makeCompliant');
    }
  }

  /**
   * Handle data deletion requests (GDPR Right to Erasure)
   */
  async handleDeletionRequest(userId, regulation = 'GDPR') {
    await this.initialize();

    try {
      const result = await this.ruleEngine.handleDeletion(userId, regulation);
      return {
        success: true,
        message: `Data deletion request processed under ${regulation}`,
        actions: result.actions,
        estimatedCompletion: result.estimatedCompletion
      };
    } catch (error) {
      throw this.handleError(error, 'handleDeletionRequest');
    }
  }

  /**
   * Classify data fields for sensitivity
   */
  async classifyData(data) {
    await this.initialize();
    return await this.ruleEngine.classifyData(data);
  }

  // Private methods
  initializeConfig(userConfig) {
    const defaults = {
      env: process.env.NODE_ENV || 'development',
      strictMode: true,
      autoEncrypt: true,
      enableAudit: true
    };

    return { ...defaults, ...userConfig };
  }

  handleError(error, method) {
    console.error(`❌ DataGuard Error in ${method}:`, error.message);
    
    if (this.config.env === 'production') {
      return new Error(`Compliance processing failed in ${method}`);
    }
    
    return error;
  }
}

module.exports = DataGuard;