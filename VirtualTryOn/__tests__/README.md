# Virtual Try-On Test Suite

Comprehensive test suite for the Gemini API-powered Virtual Try-On feature.

## Test Structure

```
__tests__/
├── geminiApiService.test.ts    # Unit tests for API service
├── integration.test.ts          # Integration tests
├── manual-test.ts               # Manual testing script
├── test-utils.ts                # Test utilities and helpers
├── setup.ts                     # Jest setup
├── jest.config.js               # Jest configuration
└── README.md                    # This file
```

## Running Tests

### Unit Tests

Run all unit tests:
```bash
npm test VirtualTryOn/__tests__/geminiApiService.test.ts
```

Run with coverage:
```bash
npm test -- --coverage VirtualTryOn/__tests__/
```

### Integration Tests

Integration tests are skipped by default. To run them:
```bash
npm test -- --testNamePattern="Integration" VirtualTryOn/__tests__/integration.test.ts
```

### Manual Testing

For manual testing with real images:

1. Update image paths in `manual-test.ts`
2. Run:
```bash
npx ts-node VirtualTryOn/__tests__/manual-test.ts
```

## Test Coverage

### Unit Tests (`geminiApiService.test.ts`)

✅ **API Service Tests**
- Successful image generation
- API error handling
- Missing image data handling
- File read errors
- Correct API endpoint and key usage
- MIME type detection

✅ **Configuration Tests**
- Valid API configuration
- Endpoint validation
- API key presence
- Timeout settings

### Integration Tests (`integration.test.ts`)

✅ **Complete Flow Tests**
- Full virtual try-on flow
- Various image formats
- Error handling
- Performance benchmarks

### Test Utilities (`test-utils.ts`)

Helper functions for:
- Creating mock data
- Validating results
- Common test scenarios
- Mock file instances

## Test Scenarios

### 1. Successful Generation
```typescript
Input: Valid user image + Valid outfit image
Expected: success: true, imageUrl: defined
```

### 2. API Error
```typescript
Input: Valid images, API returns error
Expected: success: false, error: defined
```

### 3. Missing Image Data
```typescript
Input: Valid images, API returns no image
Expected: success: false, error: "No image data found"
```

### 4. File Read Error
```typescript
Input: Invalid file paths
Expected: success: false, error: defined
```

### 5. Different Image Formats
```typescript
Input: PNG user + WebP outfit
Expected: Correct MIME types in API call
```

## Mocking Strategy

### Mocked Dependencies
- `axios` - HTTP client
- `expo-file-system` - File operations
- Console methods - Reduce test noise

### Real Dependencies
- Type definitions
- Constants
- Utility functions

## Coverage Goals

| Metric | Target | Current |
|--------|--------|---------|
| Statements | 70% | TBD |
| Branches | 70% | TBD |
| Functions | 70% | TBD |
| Lines | 70% | TBD |

## Manual Test Checklist

When running manual tests, verify:

- [ ] Images are correctly converted to base64
- [ ] API request includes correct headers
- [ ] API request includes both images
- [ ] Response is parsed correctly
- [ ] Generated image is saved to cache
- [ ] File URI is returned
- [ ] Errors are handled gracefully
- [ ] Console logs are informative

## Common Issues

### Issue: `Buffer is not defined`
**Solution**: Ensure `setup.ts` is loaded with btoa/atob polyfills

### Issue: `File system mocks not working`
**Solution**: Check that `expo-file-system` is properly mocked

### Issue: `Timeout errors`
**Solution**: Increase Jest timeout in `setup.ts`

## Adding New Tests

1. Create test file in `__tests__/` directory
2. Import test utilities from `test-utils.ts`
3. Follow existing test patterns
4. Update this README with new test coverage

## CI/CD Integration

Tests are designed to run in CI environments:
- Unit tests run on every commit
- Integration tests are skipped in CI
- Manual tests are for local development only

## Performance Benchmarks

Expected performance metrics:
- Unit tests: < 5 seconds total
- Integration tests: < 2 minutes per test
- Manual tests: 30-60 seconds per generation

## Debugging Tests

Enable verbose logging:
```bash
npm test -- --verbose VirtualTryOn/__tests__/
```

Run specific test:
```bash
npm test -- -t "should successfully generate" VirtualTryOn/__tests__/
```

Watch mode:
```bash
npm test -- --watch VirtualTryOn/__tests__/
```

## Contributing

When adding new features:
1. Write tests first (TDD)
2. Ensure all tests pass
3. Maintain coverage above 70%
4. Update this README
