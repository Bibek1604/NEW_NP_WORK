# Jest Testing Guide

This project now includes comprehensive Jest testing setup for all three sides: Server, Client, and Admin.

## Setup Completion

### ✅ Server Side (Node.js/Express)
- **Configuration**: `jest.config.js`
- **Test Runner**: `npm run test`
- **Test Watch Mode**: `npm run test:watch`
- **Coverage Report**: `npm run test:coverage`

**Sample Test**: `src/__tests__/utils.test.js`

### ✅ Client Side (React with Vite)
- **Configuration**: `jest.config.js`, `babel.config.js`, `jest.setup.js`
- **Test Runner**: `npm run test`
- **Test Watch Mode**: `npm run test:watch`
- **Coverage Report**: `npm run test:coverage`

**Sample Test**: `src/components/__tests__/Button.test.jsx`

### ✅ Admin Side (React with Vite)
- **Configuration**: `jest.config.js`, `babel.config.js`, `jest.setup.js`
- **Test Runner**: `npm run test`
- **Test Watch Mode**: `npm run test:watch`
- **Coverage Report**: `npm run test:coverage`

**Sample Test**: `src/__tests__/admin.test.js`

## Installation

Before running tests, install dependencies in each project:

```bash
# Server
cd server/server
npm install

# Client
cd client/client
npm install

# Admin
cd admin/admin
npm install
```

## Running Tests

### Run tests in any project:
```bash
npm test
```

### Watch mode (re-run on file changes):
```bash
npm run test:watch
```

### Generate coverage reports:
```bash
npm run test:coverage
```

## Test Structure

### Server Tests
- Located in: `src/__tests__/`
- Pattern: `*.test.js` or `*.spec.js`
- Example: Utility functions, helpers, API logic

### Client Tests
- Located in: `src/**/__tests__/` or `*.test.jsx`
- Pattern: `*.test.jsx` or `*.spec.jsx`
- Example: React components, hooks, utilities
- Uses: React Testing Library

### Admin Tests
- Located in: `src/__tests__/` or `src/**/__tests__/`
- Pattern: `*.test.js` or `*.spec.js`
- Example: Admin-specific logic, permissions, formatting
- Uses: Jest + React Testing Library

## Writing Tests

### Example: Server Test
```javascript
describe('User Service', () => {
  it('should create a user', () => {
    const user = createUser({ name: 'John', email: 'john@example.com' });
    expect(user.name).toBe('John');
    expect(user.email).toBe('john@example.com');
  });
});
```

### Example: Client React Component Test
```javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText(/hello/i)).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## Dependencies Added

### Server
- `jest`: ^29.7.0

### Client & Admin
- `jest`: ^29.7.0
- `@testing-library/react`: ^14.1.2
- `@testing-library/jest-dom`: ^6.1.5
- `@testing-library/user-event`: ^14.5.1
- `babel-jest`: ^29.7.0
- `jest-environment-jsdom`: ^29.7.0
- `@babel/preset-env`: ^7.23.5
- `@babel/preset-react`: ^7.23.3

## Test Coverage

To see which files are covered by tests:

```bash
npm run test:coverage
```

This will generate a coverage report showing:
- Statement coverage
- Branch coverage
- Function coverage
- Line coverage

## Best Practices

1. **Keep tests focused**: One test should test one thing
2. **Use descriptive names**: Test names should clearly describe what is being tested
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Mock external dependencies**: Use `jest.mock()` for external services
5. **Test user interactions**: For components, test how users interact with them
6. **Aim for high coverage**: But focus on meaningful tests, not just coverage numbers

## Troubleshooting

### Module not found errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Restart Jest: `npm run test -- --clearCache`

### CSS/Image import errors
- These are handled by mocks in `jest.config.js` and `__mocks__/fileMock.js`

### Transform errors
- Ensure `babel.config.js` exists in the project root
- Check that `@babel/preset-react` and `@babel/preset-env` are installed

## Next Steps

1. Add more test files following the sample patterns
2. Aim for >80% code coverage
3. Run tests in CI/CD pipeline
4. Integrate coverage reports with tools like Codecov
