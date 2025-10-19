// Global test setup
beforeAll(() => {
  // Suppress console warnings during tests
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  // Restore console warnings
  console.warn.mockRestore();
});