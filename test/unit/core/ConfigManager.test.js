const ConfigManager = require('../../../lib/core/ConfigManager');

describe('ConfigManager', () => {
  test('should merge user config with defaults', () => {
    const manager = new ConfigManager({
      autoEncrypt: false,
      customSetting: 'test'
    });

    const config = manager.config;
    
    expect(config.autoEncrypt).toBe(false);
    expect(config.customSetting).toBe('test');
    expect(config.env).toBe('test'); // Jest sets NODE_ENV=test
    expect(config.strictMode).toBe(true); // default
  });

  test('should handle empty config', () => {
    const manager = new ConfigManager();
    const config = manager.config;
    
    expect(config).toBeDefined();
    expect(config.env).toBe('test'); // Jest sets NODE_ENV=test
  });

  test('should get and set config values', () => {
    const manager = new ConfigManager();
    
    manager.set('customKey', 'customValue');
    expect(manager.get('customKey')).toBe('customValue');
    
    const allConfig = manager.getAll();
    expect(allConfig.customKey).toBe('customValue');
  });
});