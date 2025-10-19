const DataEncryptor = require('../../../lib/processors/DataEncryptor');

describe('DataEncryptor', () => {
  let encryptor;

  beforeEach(() => {
    encryptor = new DataEncryptor({
      encryptionKey: 'test-key-12345678901234567890123456789012' // 32 bytes
    });
  });

  test('should encrypt and decrypt data', () => {
    const original = 'sensitive-data';
    const encrypted = encryptor.encrypt(original, 'test-field');
    
    expect(encrypted._encrypted).toBe(true);
    expect(encrypted.algorithm).toBe('aes-256-gcm');
    expect(encrypted.field).toBe('test-field');

    const decrypted = encryptor.decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  test('should detect encrypted data', () => {
    const encrypted = encryptor.encrypt('test', 'field');
    const notEncrypted = 'plain-text';

    expect(encryptor.isEncrypted(encrypted)).toBe(true);
    expect(encryptor.isEncrypted(notEncrypted)).toBe(false);
    expect(encryptor.isEncrypted(null)).toBe(false);
  });

  test('should auto-encrypt sensitive fields', () => {
    const data = {
      email: 'test@example.com',
      phone: '+1234567890',
      name: 'Test User'
    };

    const classifications = [
      { field: 'email', encryptionRequired: true },
      { field: 'phone', encryptionRequired: true },
      { field: 'name', encryptionRequired: false }
    ];

    const encryptedData = encryptor.autoEncryptSensitiveFields(data, classifications);
    
    expect(encryptor.isEncrypted(encryptedData.email)).toBe(true);
    expect(encryptor.isEncrypted(encryptedData.phone)).toBe(true);
    expect(encryptor.isEncrypted(encryptedData.name)).toBe(false);
  });

  test('should handle encryption errors gracefully', () => {
    // Test with invalid data
    const result = encryptor.encrypt(null, 'test');
    expect(result).toBe(null);
  });

  test('should generate secure keys', () => {
    const key = DataEncryptor.generateSecureKey();
    expect(key).toHaveLength(64); // 32 bytes in hex
    expect(typeof key).toBe('string');
  });
});