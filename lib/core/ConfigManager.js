/**
 * Configuration manager for DataGuard
 */
class ConfigManager {
  constructor(userConfig = {}) {
    this.config = this.initializeConfig(userConfig);
  }

  initializeConfig(userConfig) {
    const defaults = {
      env: process.env.NODE_ENV || 'development',
      strictMode: true,
      autoEncrypt: true,
      requireExplicitConsent: true,
      enableAudit: true,
      logLevel: process.env.DATAGUARD_LOG_LEVEL || 'info'
    };

    return { ...defaults, ...userConfig };
  }

  get(key) {
    return this.config[key];
  }

  set(key, value) {
    this.config[key] = value;
  }

  getAll() {
    return { ...this.config };
  }
}

module.exports = ConfigManager;