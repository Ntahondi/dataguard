const mysql = require('mysql2/promise');

/**
 * MySQL integration for DataGuard
 * Provides automatic compliance for MySQL databases
 */
class MySQLIntegration {
  constructor(dataGuard, mysqlConfig = {}) {
    this.dataGuard = dataGuard;
    this.mysqlConfig = mysqlConfig;
    this.connection = null;
    this.initialized = false;
  }

  /**
   * Initialize MySQL connection
   */
  async initialize() {
    if (this.initialized) return;

    try {
      this.connection = await mysql.createConnection({
        host: this.mysqlConfig.host || process.env.MYSQL_HOST || 'localhost',
        user: this.mysqlConfig.user || process.env.MYSQL_USER || 'root',
        password: this.mysqlConfig.password || process.env.MYSQL_PASSWORD || '',
        database: this.mysqlConfig.database || process.env.MYSQL_DATABASE || 'dataguard',
        ...this.mysqlConfig.options
      });

      this.initialized = true;
      console.log('✅ MySQL Integration initialized successfully');
    } catch (error) {
      console.error('❌ MySQL Integration failed to initialize:', error.message);
      throw error;
    }
  }

  /**
   * Create a compliant record
   */
  async createCompliant(tableName, data, context = {}) {
    await this.initialize();

    try {
      // Make data compliant before insertion
      const compliantData = await this.dataGuard.makeCompliant(data, context);
      
      // Convert compliance metadata to JSON for storage
      const dbData = {
        ...compliantData.data,
        _compliance_metadata: JSON.stringify(compliantData.compliance),
        _processed_at: new Date()
      };

      const [result] = await this.connection.execute(
        `INSERT INTO ${tableName} SET ?`,
        [dbData]
      );

      console.log(`✅ Created compliant record in ${tableName} with ID: ${result.insertId}`);
      
      return {
        ...result,
        compliantData: compliantData.data,
        compliance: compliantData.compliance
      };
    } catch (error) {
      console.error(`❌ Failed to create compliant record in ${tableName}:`, error.message);
      throw error;
    }
  }

  /**
   * Find records with automatic compliance checking
   */
  async findCompliant(tableName, whereClause = '', params = []) {
    await this.initialize();

    try {
      const query = whereClause 
        ? `SELECT * FROM ${tableName} WHERE ${whereClause}`
        : `SELECT * FROM ${tableName}`;

      const [rows] = await this.connection.execute(query, params);

      // Check compliance of found records
      const compliantRecords = await Promise.all(
        rows.map(async row => {
          try {
            // Parse compliance metadata if it exists
            let existingCompliance = null;
            if (row._compliance_metadata) {
              existingCompliance = JSON.parse(row._compliance_metadata);
            }

            const complianceCheck = await this.dataGuard.classifyData(row);
            
            return {
              ...row,
              _complianceCheck: {
                checkedAt: new Date(),
                classifications: complianceCheck,
                isCompliant: this.isRecordCompliant(complianceCheck),
                existingCompliance: existingCompliance
              }
            };
          } catch (error) {
            console.warn('Compliance check failed for record:', error.message);
            return row;
          }
        })
      );

      console.log(`✅ Found ${compliantRecords.length} records in ${tableName}`);
      
      return compliantRecords;
    } catch (error) {
      console.error(`❌ Failed to find records in ${tableName}:`, error.message);
      throw error;
    }
  }

  /**
   * Check if a record is compliant
   */
  isRecordCompliant(classifications) {
    const highRiskFields = classifications.filter(c => 
      c.sensitivity === 'high' || c.sensitivity === 'critical'
    );

    const unencryptedHighRisk = highRiskFields.filter(c => 
      !c.encryptionRequired || c.recommendation.includes('encrypt')
    );

    return unencryptedHighRisk.length === 0;
  }

  /**
   * Create compliance tables if they don't exist
   */
  async setupComplianceTables() {
    await this.initialize();

    try {
      // Users table with compliance fields
      await this.connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255),
          phone VARCHAR(50),
          name VARCHAR(255),
          _compliance_metadata JSON,
          _processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          _anonymized BOOLEAN DEFAULT FALSE,
          _anonymized_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Consent tracking table
      await this.connection.execute(`
        CREATE TABLE IF NOT EXISTS user_consents (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          consent_type VARCHAR(100),
          consent_given BOOLEAN,
          recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ip_address VARCHAR(45),
          user_agent TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Deletion requests table
      await this.connection.execute(`
        CREATE TABLE IF NOT EXISTS deletion_requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          regulation VARCHAR(50),
          requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP NULL,
          status ENUM('pending', 'processing', 'completed', 'failed'),
          actions_taken JSON,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      console.log('✅ Compliance tables created successfully');
    } catch (error) {
      console.warn('⚠️ Could not create compliance tables:', error.message);
    }
  }
}

module.exports = MySQLIntegration;