const { MongoClient } = require('mongodb');

/**
 * MongoDB integration for DataGuard
 * Provides automatic compliance for MongoDB collections
 */
class MongoDBIntegration {
  constructor(dataGuard, mongoConfig = {}) {
    this.dataGuard = dataGuard;
    this.mongoConfig = mongoConfig;
    this.client = null;
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize MongoDB connection
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const url = this.mongoConfig.url || process.env.MONGODB_URL || 'mongodb://localhost:27017';
      const dbName = this.mongoConfig.dbName || process.env.MONGODB_DB_NAME || 'dataguard';
      
      this.client = new MongoClient(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        ...this.mongoConfig.options
      });

      await this.client.connect();
      this.db = this.client.db(dbName);
      this.initialized = true;

      console.log('✅ MongoDB Integration initialized successfully');
    } catch (error) {
      console.error('❌ MongoDB Integration failed to initialize:', error.message);
      throw error;
    }
  }

  /**
   * Create a compliant document
   */
  async createCompliant(collectionName, data, context = {}) {
    await this.initialize();

    try {
      // Make data compliant before insertion
      const compliantData = await this.dataGuard.makeCompliant(data, context);
      
      const collection = this.db.collection(collectionName);
      const result = await collection.insertOne(compliantData.data);

      console.log(`✅ Created compliant document in ${collectionName} with ID: ${result.insertedId}`);
      
      return {
        ...result,
        compliantData: compliantData.data,
        compliance: compliantData.compliance
      };
    } catch (error) {
      console.error(`❌ Failed to create compliant document in ${collectionName}:`, error.message);
      throw error;
    }
  }

  /**
   * Find documents with automatic compliance checking
   */
  async findCompliant(collectionName, query = {}, options = {}) {
    await this.initialize();

    try {
      const collection = this.db.collection(collectionName);
      const documents = await collection.find(query, options).toArray();

      // Check compliance of found documents
      const compliantDocuments = await Promise.all(
        documents.map(async doc => {
          try {
            const complianceCheck = await this.dataGuard.classifyData(doc);
            return {
              ...doc,
              _complianceCheck: {
                checkedAt: new Date(),
                classifications: complianceCheck,
                isCompliant: this.isDocumentCompliant(complianceCheck)
              }
            };
          } catch (error) {
            console.warn('Compliance check failed for document:', error.message);
            return doc;
          }
        })
      );

      console.log(`✅ Found ${compliantDocuments.length} documents in ${collectionName}`);
      
      return compliantDocuments;
    } catch (error) {
      console.error(`❌ Failed to find documents in ${collectionName}:`, error.message);
      throw error;
    }
  }

  /**
   * Handle GDPR deletion request for a user
   */
  async handleUserDeletion(userId, regulation = 'GDPR', options = {}) {
    await this.initialize();

    try {
      const deletionResult = await this.dataGuard.handleDeletionRequest(userId, regulation);
      
      // Find all collections that might contain user data
      const collections = await this.db.listCollections().toArray();
      const deletionOperations = [];

      for (const collectionInfo of collections) {
        const collection = this.db.collection(collectionInfo.name);
        
        // Try to find user data using common field patterns
        const userQuery = this.buildUserQuery(userId, collectionInfo.name);
        const userDocuments = await collection.find(userQuery).toArray();

        if (userDocuments.length > 0) {
          deletionOperations.push({
            collection: collectionInfo.name,
            documentCount: userDocuments.length,
            action: options.anonymize ? 'anonymize' : 'delete'
          });

          if (options.anonymize) {
            // Anonymize user data instead of deleting
            await this.anonymizeUserData(collection, userQuery, userId);
          } else {
            // Delete user data
            await collection.deleteMany(userQuery);
          }
        }
      }

      console.log(`✅ Processed deletion request for user ${userId}`);
      console.log(`   Operations: ${deletionOperations.length} collections affected`);
      
      return {
        ...deletionResult,
        databaseOperations: deletionOperations,
        totalCollectionsScanned: collections.length
      };
    } catch (error) {
      console.error(`❌ Failed to process deletion request for user ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Build query to find user data across different collection structures
   */
  buildUserQuery(userId, collectionName) {
    const commonUserFields = [
      'userId', 'user_id', 'user.id', 'user._id',
      'authorId', 'author_id', 'author.id',
      'ownerId', 'owner_id', 'owner.id',
      'creatorId', 'creator_id', 'creator.id'
    ];

    const query = {
      $or: [
        { _id: userId },
        { userId: userId },
        { 'user.id': userId }
      ]
    };

    // Add collection-specific queries
    if (collectionName.includes('user') || collectionName.includes('profile')) {
      query.$or.push({ email: { $regex: userId, $options: 'i' } });
    }

    return query;
  }

  /**
   * Anonymize user data instead of deleting (for legal retention requirements)
   */
  async anonymizeUserData(collection, userQuery, userId) {
    const anonymizationUpdate = {
      $set: {
        _anonymized: true,
        _anonymizedAt: new Date(),
        _originalUserId: userId
      },
      $unset: {
        email: "",
        phone: "",
        name: "",
        address: "",
        ipAddress: "",
        userAgent: ""
      }
    };

    await collection.updateMany(userQuery, anonymizationUpdate);
  }

  /**
   * Check if a document is compliant based on classifications
   */
  isDocumentCompliant(classifications) {
    const highRiskFields = classifications.filter(c => 
      c.sensitivity === 'high' || c.sensitivity === 'critical'
    );

    const unencryptedHighRisk = highRiskFields.filter(c => 
      !c.encryptionRequired || c.recommendation.includes('encrypt')
    );

    return unencryptedHighRisk.length === 0;
  }

  /**
   * Create indexes for compliance monitoring
   */
  async createComplianceIndexes() {
    await this.initialize();

    try {
      const indexes = {
        users: [
          { key: { '_compliance.processedAt': 1 } },
          { key: { '_consent.recordedAt': 1 } },
          { key: { '_anonymized': 1 } }
        ],
        profiles: [
          { key: { 'email': 1 } },
          { key: { '_compliance.applicableLaws': 1 } }
        ]
      };

      for (const [collectionName, collectionIndexes] of Object.entries(indexes)) {
        const collection = this.db.collection(collectionName);
        
        for (const index of collectionIndexes) {
          await collection.createIndex(index.key, { background: true });
        }
      }

      console.log('✅ Compliance indexes created successfully');
    } catch (error) {
      console.warn('⚠️ Could not create compliance indexes:', error.message);
    }
  }

  /**
   * Get compliance statistics for the database
   */
  async getComplianceStats() {
    await this.initialize();

    try {
      const collections = await this.db.listCollections().toArray();
      const stats = {
        totalCollections: collections.length,
        collections: []
      };

      for (const collectionInfo of collections) {
        const collection = this.db.collection(collectionInfo.name);
        
        const totalDocs = await collection.countDocuments();
        const compliantDocs = await collection.countDocuments({
          '_compliance.processedAt': { $exists: true }
        });
        const anonymizedDocs = await collection.countDocuments({
          '_anonymized': true
        });

        stats.collections.push({
          name: collectionInfo.name,
          totalDocuments: totalDocs,
          compliantDocuments: compliantDocs,
          anonymizedDocuments: anonymizedDocs,
          compliancePercentage: totalDocs > 0 ? Math.round((compliantDocs / totalDocs) * 100) : 0
        });
      }

      return stats;
    } catch (error) {
      console.error('❌ Failed to get compliance stats:', error.message);
      throw error;
    }
  }

  /**
   * Close MongoDB connection
   */
  async close() {
    if (this.client) {
      await this.client.close();
      this.initialized = false;
      console.log('✅ MongoDB connection closed');
    }
  }
}

module.exports = MongoDBIntegration;