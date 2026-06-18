---
name: Test-writer
description: Use when writing, fixing, or running tests for the project
---

## Testing Rules

### Framework
- Always use node:test + node:assert (built-in Node.js)
- Never install or use Jest, Mocha, or other external frameworks
- Run tests with: npm test

### Mocking
- All external calls (fetch, API) must be fully mocked using mock.method from node:test
- Never make real network requests in tests
- Mock responses must match real API response structure

### File location
- Place tests in __tests__/ folder or as moduleName.test.js next to source

### Rules
- After writing tests always run npm test and confirm all pass
- When changing a function — check if test exists, create if missing
- When adding a new function — add a test