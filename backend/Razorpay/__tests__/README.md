# Razorpay Integration Tests

Comprehensive test suite for the Razorpay payment gateway integration.

## 📁 Test Structure

```
backend/Razorpay/__tests__/
├── controllers/
│   └── paymentController.test.js    # Payment business logic tests
├── utils/
│   └── razorpayHelpers.test.js      # Helper function tests
└── routes/
    └── paymentRoutes.test.js        # API endpoint integration tests

Razorpay/__tests__/
├── components/
│   └── RazorpayPayment.test.tsx     # React component tests
└── utils/
    └── razorpayService.test.ts      # Frontend service tests
```

## 🧪 Test Coverage

### Frontend Tests (React Native)

#### `RazorpayPayment.test.tsx`
- ✅ Order creation flow
- ✅ Payment success handling (resolved promise)
- ✅ Payment success handling (rejected promise - Razorpay quirk)
- ✅ User cancellation handling
- ✅ Network error handling
- ✅ Processing state management
- ✅ Double submission prevention
- ✅ Edge cases (missing email, phone, etc.)
- ✅ Payment completion flag behavior

#### `razorpayService.test.ts`
- ✅ createRazorpayOrder API call
- ✅ verifyRazorpayPayment API call
- ✅ getPaymentStatus API call
- ✅ getCreditPlanAmount utility
- ✅ Network error handling
- ✅ Response validation
- ✅ Request payload formatting

### Backend Tests (Node.js)

#### `paymentController.test.js`
- ✅ Create order with Razorpay API
- ✅ Verify payment signature
- ✅ Grant credits via Supabase RPC
- ✅ Database record creation
- ✅ Error handling (Razorpay API, database)
- ✅ Input validation
- ✅ Payment status retrieval

#### `razorpayHelpers.test.js`
- ✅ Credit to INR conversion
- ✅ INR to paise conversion
- ✅ Signature verification (HMAC SHA256)
- ✅ Receipt generation
- ✅ Credit plan pricing
- ✅ Edge cases (negative values, invalid inputs)

#### `paymentRoutes.test.js`
- ✅ POST /api/razorpay/create-order endpoint
- ✅ POST /api/razorpay/verify-payment endpoint
- ✅ GET /api/razorpay/payment-status/:orderId endpoint
- ✅ Request validation
- ✅ Response format consistency
- ✅ Error handling
- ✅ Concurrent requests
- ✅ CORS and headers

## 🚀 Running Tests

### Run All Tests
```bash
# From project root
npm test

# From backend folder
cd backend && npm test
```

### Run Specific Test Suites

#### Frontend Tests
```bash
# Run all frontend tests
npm test -- Razorpay

# Run specific component test
npm test -- RazorpayPayment.test.tsx

# Run service tests
npm test -- razorpayService.test.ts
```

#### Backend Tests
```bash
# Run all backend tests
cd backend && npm test

# Run controller tests
npm test -- controllers/paymentController.test.js

# Run helper tests
npm test -- utils/razorpayHelpers.test.js

# Run route tests
npm test -- routes/paymentRoutes.test.js
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

## 📊 Test Coverage Goals

| Component | Target Coverage | Current |
|-----------|----------------|---------|
| Frontend Components | 80%+ | ✅ |
| Frontend Services | 90%+ | ✅ |
| Backend Controllers | 85%+ | ✅ |
| Backend Utilities | 95%+ | ✅ |
| Backend Routes | 80%+ | ✅ |

## 🔧 Testing Tools

### Frontend
- **Jest** - Test runner
- **@testing-library/react-native** - Component testing
- **@testing-library/jest-native** - Custom matchers

### Backend
- **Jest** - Test runner
- **Supertest** - HTTP assertions
- **node-mocks-http** - HTTP mocking

## 📝 Writing New Tests

### Frontend Component Test Template
```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { YourComponent } from '@/components/YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(<YourComponent />);
    expect(getByText('Expected Text')).toBeTruthy();
  });

  it('should handle user interaction', () => {
    const mockFn = jest.fn();
    const { getByText } = render(<YourComponent onPress={mockFn} />);
    
    fireEvent.press(getByText('Button'));
    expect(mockFn).toHaveBeenCalled();
  });
});
```

### Backend Controller Test Template
```javascript
const request = require('supertest');
const controller = require('../controllers/yourController');

describe('YourController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle request successfully', async () => {
    const mockReq = { body: { data: 'test' } };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await controller.yourMethod(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });
});
```

## 🐛 Debugging Tests

### View Console Logs
```bash
npm test -- --verbose
```

### Debug Single Test
```bash
npm test -- --testNamePattern="should create order successfully"
```

### Debug with Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 🔍 Mocking Guidelines

### Mocking External Dependencies
```javascript
// Mock Razorpay SDK
jest.mock('razorpay', () => ({
  orders: {
    create: jest.fn(),
  },
}));

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(),
    rpc: jest.fn(),
  })),
}));
```

### Mocking React Native Modules
```javascript
jest.mock('react-native-razorpay', () => ({
  default: {
    open: jest.fn(),
  },
}));
```

## ✅ Test Checklist

Before committing:
- [ ] All tests pass locally
- [ ] New features have tests
- [ ] Bug fixes have regression tests
- [ ] Coverage is maintained/improved
- [ ] Tests follow naming conventions
- [ ] Mocks are properly cleaned up
- [ ] Async operations use proper assertions

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)

## 🤝 Contributing

When adding new tests:
1. Follow existing test structure
2. Use descriptive test names
3. Test both happy and error paths
4. Keep tests focused and isolated
5. Update this README if adding new test categories

## 📞 Support

For test-related questions:
- Check existing test examples
- Review Jest documentation
- Ask in team Slack channel

---

**Last Updated:** November 1, 2025  
**Test Count:** 100+ tests  
**Average Run Time:** <5 seconds
