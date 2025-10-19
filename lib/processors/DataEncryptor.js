const crypto = require('crypto');

/**
 * Handles encryption and decryption of sensitive data fields
 */
class DataEncryptor {
  constructor(config = {}) {
    this.config = {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
      saltLength: 16,
      ...config
    };
    
    this.encryptionKey = this.config.encryptionKey || 
      process.env.DATAGUARD_ENCRYPTION_KEY || 
      this.generateTemporaryKey();
  }

  /**
   * Encrypt a sensitive field value
   */
  encrypt(value, fieldName = 'unknown') {
    if (value === null || value === undefined) return value;
    
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      // Generate random IV and salt
      const iv = crypto.randomBytes(this.config.ivLength);
      const salt = crypto.randomBytes(this.config.saltLength);
      
      // Derive key from master key and salt
      const key = crypto.pbkdf2Sync(
        this.encryptionKey, 
        salt, 
        100000, 
        this.config.keyLength, 
        'sha256'
      );
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.config.algorithm, key, iv);
      
      // Encrypt the data
      let encrypted = cipher.update(stringValue, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get auth tag for GCM mode
      const authTag = cipher.getAuthTag();
      
      // Return structured encrypted data
      return {
        _encrypted: true,
        version: '1.0',
        algorithm: this.config.algorithm,
        data: encrypted,
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        authTag: authTag.toString('hex'),
        field: fieldName,
        encryptedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`Encryption failed for field ${fieldName}:`, error.message);
      return value; // Return original value if encryption fails
    }
  }

  /**
   * Decrypt an encrypted field value
   */
  decrypt(encryptedData) {
    if (!encryptedData || !encryptedData._encrypted) {
      return encryptedData; // Not encrypted, return as-is
    }
    
    try {
      const { data, iv, salt, authTag, field } = encryptedData;
      
      // Derive key from master key and salt
      const key = crypto.pbkdf2Sync(
        this.encryptionKey,
        Buffer.from(salt, 'hex'),
        100000,
        this.config.keyLength,
        'sha256'
      );
      
      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.config.algorithm, 
        key, 
        Buffer.from(iv, 'hex')
      );
      
      // Set auth tag for GCM mode
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      // Decrypt the data
      let decrypted = decipher.update(data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Try to parse as JSON, otherwise return as string
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
      
    } catch (error) {
      console.error(`Decryption failed:`, error.message);
      throw new Error(`Failed to decrypt field: ${error.message}`);
    }
  }

  /**
   * Check if a value is encrypted
   */
    isEncrypted(value) {
    return !!value && 
            typeof value === 'object' && 
            value._encrypted === true;
    }

  /**
   * Auto-encrypt sensitive fields in an object
   */
  autoEncryptSensitiveFields(data, classifications) {
    const encryptedData = { ...data };
    
    classifications.forEach(classification => {
      const { field, encryptionRequired } = classification;
      
      if (encryptionRequired && encryptedData[field] && !this.isEncrypted(encryptedData[field])) {
        encryptedData[field] = this.encrypt(encryptedData[field], field);
      }
    });
    
    return encryptedData;
  }

  /**
   * Auto-decrypt encrypted fields in an object
   */
  autoDecryptSensitiveFields(data) {
    const decryptedData = { ...data };
    
    for (const [field, value] of Object.entries(decryptedData)) {
      if (this.isEncrypted(value)) {
        try {
          decryptedData[field] = this.decrypt(value);
        } catch (error) {
          console.warn(`Failed to decrypt field ${field}:`, error.message);
          // Keep encrypted value if decryption fails
        }
      }
    }
    
    return decryptedData;
  }

  /**
   * Generate a temporary key for development (WARNING: Not for production!)
   */
  generateTemporaryKey() {
    console.warn('⚠️  Using temporary encryption key - NOT SECURE FOR PRODUCTION!');
    console.warn('⚠️  Set DATAGUARD_ENCRYPTION_KEY environment variable for production use.');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate a secure encryption key
   */
  static generateSecureKey() {
    return crypto.randomBytes(32).toString('hex');
  }
}

module.exports = DataEncryptor;