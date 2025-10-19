const request = require('supertest');

function createTestApp() {
  const express = require('express');
  const { dataGuardMiddleware, requireCompliance } = require('../../lib/web/express');

  const app = express();
  app.use(express.json());
  
  // Create middleware that doesn't auto-process for specific tests
  const conditionalMiddleware = (req, res, next) => {
    // Only process if not testing the profile endpoint without compliance
    if (req.path === '/profile' && !req.get('x-test-no-compliance')) {
      return dataGuardMiddleware({ autoEncrypt: false })(req, res, next);
    }
    if (req.path !== '/profile') {
      return dataGuardMiddleware({ autoEncrypt: false })(req, res, next);
    }
    next();
  };
  
  app.use(conditionalMiddleware);

  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  app.post('/register', (req, res) => {
    res.json({
      success: true,
      user: { id: 'test-user' },
      compliance: req.compliance || { processed: false }
    });
  });

  app.post('/profile', requireCompliance(['GDPR']), (req, res) => {
    res.json({ success: true, message: 'Profile updated' });
  });

  return app;
}

describe('Express Integration', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  test('GET /health should return 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
  });

  test('POST /register should process compliance', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User'
    };

    const response = await request(app)
      .post('/register')
      .send(userData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.compliance.processed).toBe(true);
  });

  test('POST /profile should require GDPR compliance', async () => {
    const response = await request(app)
      .post('/profile')
      .set('x-test-no-compliance', 'true') // Skip compliance processing
      .send({ name: 'Test User' });

    // Should fail without compliance processing
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Compliance processing required');
  });

  test('POST /profile should work with compliance', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User'
    };

    const response = await request(app)
      .post('/profile')
      .send(userData);

    // Should work with compliance processing
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});