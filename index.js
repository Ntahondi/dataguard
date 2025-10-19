const DataGuard = require('./lib/core/DataGuard');

// Create default instance
let defaultInstance = null;

function createDataGuard(config = {}) {
  return new DataGuard(config);
}

function getDefaultInstance() {
  if (!defaultInstance) {
    defaultInstance = createDataGuard();
  }
  return defaultInstance;
}

// Quick start helpers
async function makeCompliant(data, context) {
  const instance = getDefaultInstance();
  return await instance.makeCompliant(data, context);
}

async function handleDeletionRequest(userId, regulation = 'GDPR') {
  const instance = getDefaultInstance();
  return await instance.handleDeletionRequest(userId, regulation);
}

async function classifyData(data) {
  const instance = getDefaultInstance();
  return await instance.classifyData(data);
}

// Main exports
module.exports = DataGuard;
module.exports.createDataGuard = createDataGuard;
module.exports.getDefaultInstance = getDefaultInstance;
module.exports.makeCompliant = makeCompliant;
module.exports.handleDeletionRequest = handleDeletionRequest;
module.exports.classifyData = classifyData;