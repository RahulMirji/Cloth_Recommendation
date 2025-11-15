# Virtual Try-On Edge Function Tests

Comprehensive test suite for the Vertex AI Virtual Try-On implementation.

## Test Structure

```
__tests__/
├── jwt.test.ts              # JWT creation and authentication tests
├── integration.test.ts      # API flow integration tests
├── error-handling.test.ts   # Edge cases and error scenarios
└── test-utils.ts           # Shared utilities and mock data
```

## Running Tests

### Prerequisites
- Deno installed (https://deno.land/)
- Test environment variables set (optional for unit tests)

### Run All Tests
```bash
cd supabase/functions/virtual-tryon
deno task test
```

### Run Tests in Watch Mode
```bash
deno task test:watch
```

### Run Tests with Coverage
```bash
deno task test:coverage
deno task coverage
```

### Run Specific Test File
```bash
deno test --allow-net --allow-env --allow-read __tests__/jwt.test.ts
```

## Test Coverage

### 1. JWT Unit Tests (`jwt.test.ts`)
- ✅ Base64URL encoding (strings and Uint8Arrays)
- ✅ JWT structure validation (header, payload, signature)
- ✅ Timestamp validation (iat, exp)
- ✅ Invalid service account handling
- ✅ JSON object encoding/decoding

### 2. Integration Tests (`integration.test.ts`)
- ✅ OAuth token exchange (success/failure)
- ✅ Vertex AI API calls
- ✅ Response parsing
- ✅ Base64 to Uint8Array conversion
- ✅ CORS headers validation
- ✅ Empty predictions handling

### 3. Error Handling Tests (`error-handling.test.ts`)
- ✅ Missing request parameters
- ✅ Invalid base64 format
- ✅ Missing environment variables
- ✅ Invalid service account configuration
- ✅ Network timeouts
- ✅ Malformed API responses
- ✅ Storage upload failures
- ✅ Large image handling
- ✅ Concurrent request simulation
- ✅ JWT expiration validation

### 4. Test Utilities (`test-utils.ts`)
- Mock service accounts
- Mock API responses (OAuth, Vertex AI, Supabase)
- Mock fetch function
- Request/Response helpers
- Validation utilities
- Base64 conversion helpers

## Test Data

All test data uses mock/sample values:
- Sample 1x1 PNG images (base64 encoded)
- Mock service account (NOT for production use)
- Mock API responses
- Test environment variables

**⚠️ Never use test credentials in production!**

## Environment Variables for Testing

Optional for integration tests:

```bash
export VERTEX_API='{"type": "service_account", ...}'
export GOOGLE_PROJECT_ID="test-project"
export GOOGLE_LOCATION="us-central1"
export SUPABASE_URL="https://test.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="test-key"
```

Unit tests will work without these variables.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Virtual Try-On Edge Function

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Deno
        uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x
      
      - name: Run Tests
        working-directory: supabase/functions/virtual-tryon
        run: deno task test
      
      - name: Generate Coverage
        working-directory: supabase/functions/virtual-tryon
        run: |
          deno task test:coverage
          deno task coverage
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./supabase/functions/virtual-tryon/coverage/lcov.info
```

## Test Scenarios Covered

### Security Tests
- ✅ Environment variable validation
- ✅ Service account validation
- ✅ JWT token creation
- ✅ Access token handling

### API Integration Tests
- ✅ OAuth flow
- ✅ Vertex AI API calls
- ✅ Error response handling
- ✅ Rate limiting scenarios

### Data Processing Tests
- ✅ Base64 encoding/decoding
- ✅ Binary data conversion
- ✅ Image size validation
- ✅ File path generation

### Error Scenarios
- ✅ Missing credentials
- ✅ Invalid input data
- ✅ API failures
- ✅ Network issues
- ✅ Storage errors

## Maintenance

### Adding New Tests

1. Create test file in `__tests__/` directory
2. Import test utilities from `test-utils.ts`
3. Use Deno's test framework: `Deno.test("description", () => { ... })`
4. Add mock data to `test-utils.ts` if needed
5. Run tests to verify

### Updating Mock Data

Edit `test-utils.ts` to update:
- Sample images
- Mock API responses
- Environment variables
- Test utilities

### Best Practices

- ✅ Keep tests isolated (no shared state)
- ✅ Use descriptive test names
- ✅ Mock external dependencies
- ✅ Test both success and failure paths
- ✅ Validate edge cases
- ✅ Keep mock data realistic but safe

## Test Results

Expected output when running tests:

```
running 30 tests from __tests__/jwt.test.ts
test base64UrlEncode - encodes string correctly ... ok (2ms)
test base64UrlEncode - encodes Uint8Array correctly ... ok (1ms)
test createGoogleJWT - creates valid JWT structure ... ok (15ms)
...

running 12 tests from __tests__/integration.test.ts
test Integration - Full successful flow ... ok (50ms)
test Integration - OAuth token exchange success ... ok (20ms)
...

running 30 tests from __tests__/error-handling.test.ts
test Error - Missing user image ... ok (1ms)
test Error - Invalid base64 format ... ok (1ms)
...

✅ All tests passed
```

## Troubleshooting

### Tests Failing

1. **Import errors**: Ensure Deno is installed and permissions are granted
2. **Network errors**: Check if mocking is correctly applied
3. **Type errors**: Verify TypeScript types match expected values

### Performance Issues

- Reduce test parallelization
- Use `--no-check` flag for faster runs (skip type checking)
- Mock expensive operations

### Coverage Issues

- Ensure `--coverage` flag is used
- Check that all code paths are tested
- Review uncovered lines with `deno coverage`

## Resources

- [Deno Testing Guide](https://deno.land/manual/testing)
- [Deno Assertions](https://deno.land/std/testing/asserts.ts)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

**Last Updated:** November 14, 2025  
**Test Coverage:** ~85% (JWT creation with real RSA keys needs actual credentials)
