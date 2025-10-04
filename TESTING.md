# Testing Guide - AI Cloth Recommendation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Coverage Reports](#coverage-reports)
6. [CI/CD Integration](#cicd-integration)

---

## 🎯 Overview

This project uses **Jest** and **React Native Testing Library** for testing. The test suite includes:

- ✅ **Unit Tests**: Test individual functions and components
- ✅ **Integration Tests**: Test component interactions
- ✅ **Context Tests**: Test React context providers
- ✅ **API Tests**: Test API integration (mocked)

### Test Coverage Goals:
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

---

## 📁 Test Structure

```
__tests__/
├── components/          # Component tests
│   ├── PrimaryButton.test.tsx
│   └── ...
├── screens/            # Screen tests
│   ├── HomeScreen.test.tsx
│   ├── SettingsScreen.test.tsx
│   └── ...
├── contexts/           # Context tests
│   └── AppContext.test.tsx
├── utils/              # Utility function tests
│   └── pollinationsAI.test.ts
└── e2e/                # End-to-end tests (future)
```

---

## 🚀 Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests for CI
```bash
npm run test:ci
```

### Run Specific Test File
```bash
npm test -- HomeScreen.test.tsx
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="should render"
```

---

## ✍️ Writing Tests

### Component Test Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react-native';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeTruthy();
  });

  it('handles button press', () => {
    const onPress = jest.fn();
    render(<MyComponent onPress={onPress} />);
    
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### Context Test Example

```typescript
import { renderHook, act } from '@testing-library/react-native';
import { AppProvider, useApp } from '@/contexts/AppContext';

describe('AppContext', () => {
  it('updates state correctly', async () => {
    const { result } = renderHook(() => useApp(), {
      wrapper: AppProvider,
    });

    await act(async () => {
      await result.current.updateSettings({ isDarkMode: true });
    });

    expect(result.current.settings.isDarkMode).toBe(true);
  });
});
```

### API Test Example

```typescript
import { generateText } from '@/utils/pollinationsAI';

describe('pollinationsAI', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('calls API correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'Response' } }]
      }),
    });

    const result = await generateText({
      messages: [{ role: 'user', content: 'Test' }],
    });

    expect(result).toBe('Response');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://text.pollinations.ai/openai',
      expect.any(Object)
    );
  });
});
```

---

## 📊 Coverage Reports

### View Coverage in Terminal
```bash
npm run test:coverage
```

### View HTML Coverage Report
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

### Coverage Output Example
```
--------------------------|---------|----------|---------|---------|
File                      | % Stmts | % Branch | % Funcs | % Lines |
--------------------------|---------|----------|---------|---------|
All files                 |   85.2  |   78.4   |   82.1  |   85.8  |
 components/              |   92.1  |   85.3   |   90.0  |   92.5  |
  PrimaryButton.tsx       |   100   |   100    |   100   |   100   |
 screens/                 |   78.5  |   72.1   |   75.0  |   79.2  |
  HomeScreen.tsx          |   85.7  |   80.0   |   83.3  |   86.4  |
 utils/                   |   88.9  |   81.2   |   87.5  |   89.3  |
  pollinationsAI.ts       |   90.5  |   83.3   |   91.7  |   90.9  |
--------------------------|---------|----------|---------|---------|
```

---

## 🔄 CI/CD Integration

### GitHub Actions Workflows

#### 1. **CI/CD Pipeline** (`.github/workflows/ci-cd.yml`)
Runs on every push and pull request:
- ✅ Run tests with coverage
- ✅ TypeScript type checking
- ✅ Build web app
- ✅ Security scan
- ✅ Deploy to production (master branch only)

#### 2. **PR Checks** (`.github/workflows/pr-checks.yml`)
Runs on every pull request:
- 📊 PR statistics (files changed, lines added/deleted)
- 🔍 Code quality checks
- 📈 Test coverage report
- 📦 Bundle size check

#### 3. **Security Scan** (`.github/workflows/security-scan.yml`)
Runs daily at 2 AM UTC:
- 🔒 NPM audit for vulnerabilities
- 📦 Check outdated dependencies
- 🚨 Create issues for security concerns

### Workflow Status Badges

Add these to your README.md:

```markdown
![CI/CD](https://github.com/RahulMirji/Cloth_Recommendation/workflows/CI/CD%20Pipeline/badge.svg)
![Tests](https://github.com/RahulMirji/Cloth_Recommendation/workflows/Tests/badge.svg)
![Coverage](https://img.shields.io/codecov/c/github/RahulMirji/Cloth_Recommendation)
```

---

## 🛠️ Test Configuration

### `jest.config.js`
- Preset: `jest-expo`
- Transform ignore patterns for React Native
- Module name mapping for `@/` imports
- Coverage collection settings

### `jest.setup.js`
- Mock implementations for:
  - AsyncStorage
  - expo-router
  - expo-linear-gradient
  - expo-blur
  - expo-image-picker
  - lucide-react-native
  - react-native-onboarding-swiper

---

## 🧪 Testing Best Practices

### DO ✅
- Write tests for all new features
- Test edge cases and error scenarios
- Use descriptive test names
- Keep tests isolated and independent
- Mock external dependencies (API calls, storage)
- Test user interactions (button clicks, form submissions)
- Aim for high coverage (>80%)

### DON'T ❌
- Test implementation details
- Write tests that depend on other tests
- Mock too much (test real behavior when possible)
- Ignore failing tests
- Skip writing tests for "simple" components
- Test third-party libraries (they have their own tests)

---

## 🐛 Debugging Tests

### Run in Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Use VS Code Debugger
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### View Test Output
```bash
npm test -- --verbose
```

---

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Expo Testing Guide](https://docs.expo.dev/develop/unit-testing/)

---

## 🎯 Next Steps

### Immediate
- [ ] Write tests for remaining screens
- [ ] Add tests for custom hooks
- [ ] Improve coverage to >80%

### Future
- [ ] Add E2E tests with Detox
- [ ] Add visual regression tests
- [ ] Add performance tests
- [ ] Set up test parallelization

---

## 💡 Tips for Success

1. **Run tests before committing**: `npm test`
2. **Check coverage regularly**: `npm run test:coverage`
3. **Fix failing tests immediately**: Don't let them accumulate
4. **Review test output in CI/CD**: Check GitHub Actions logs
5. **Keep tests fast**: Mock heavy operations (API calls, database)

---

**Happy Testing! 🚀**

*For questions or issues, please open a GitHub issue.*
