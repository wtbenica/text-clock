# Testing Setup for Text Clock GNOME Extension

This document describes the testing infrastructure implemented for the Text Clock GNOME Extension.

## Overview

The testing setup focuses on three main areas:
- **Unit Tests**: Test pure logic and functions without dependencies
- **Integration Tests**: Test component interactions and configuration integrity
- **UI Tests**: Test UI components and user interactions (future work)

## Test Structure

```
tests/
├── unit/           # Unit tests for pure logic
├── integration/    # Integration tests for component interactions
├── ui/             # UI tests (future implementation)
├── helpers/        # Test helper functions
├── mocks/          # Mock implementations for GNOME Shell APIs
│   ├── gi/         # GObject Introspection mocks
│   └── resource/   # GNOME Shell resource mocks
└── setup.ts        # Global test setup and configuration
```

## Test Configuration

- **Test Framework**: Jest with TypeScript support
- **Coverage**: Configured to track coverage for all source files
- **Mocking**: Custom mocks for GNOME Shell APIs (GObject, Gio, St, etc.)
- **Setup**: Global setup file configures test environment

## Running Tests

```bash
# Run all tests
yarn test

# Run tests with coverage
yarn test --coverage

# Run tests in watch mode
yarn test:watch

# Run specific test file
yarn test tests/unit/clock-formatter.test.ts
```

## Test Categories

### Unit Tests

Currently implemented unit tests cover:

1. **ClockFormatter** (`tests/unit/clock-formatter.test.ts`)
   - Time formatting logic
   - Date handling and rollover
   - Different time formats (format-one, format-two)
   - Fuzziness handling
   - Edge cases and error handling

2. **WordPack** (`tests/unit/word-pack.test.ts`)
   - Translation string management
   - Time format selection
   - Error handling for invalid formats
   - Data integrity validation

### Integration Tests

1. **Constants** (`tests/integration/constants.test.ts`)
   - Settings constants validation
   - Error message availability
   - Configuration integrity

## Mock System

The mock system provides implementations for GNOME Shell APIs:

- **GObject**: Property system and class registration
- **Gio**: Settings management and binding
- **St**: UI components (Label, BoxLayout)
- **Clutter**: Actor system and alignment
- **GnomeDesktop**: Wall clock functionality
- **GNOME Shell Resources**: Extension system and main UI

## Code Coverage

Current coverage focuses on the core business logic:

- **ClockFormatter**: ~92% coverage
- **WordPack**: 100% coverage
- **Constants**: 100% coverage

Files requiring GNOME Shell runtime (extension.ts, UI components) are excluded from coverage collection due to dependency complexity.

## Design Principles

1. **Dependency Injection Ready**: Tests demonstrate how components can be isolated and tested independently
2. **Pure Logic Focus**: Core formatting and translation logic is thoroughly tested
3. **Mock Compatibility**: Mocks closely mirror GNOME Shell API behavior
4. **Easy Extension**: Test structure supports adding new test categories

## Future Improvements

1. **Extension Lifecycle Tests**: Test extension enable/disable cycles
2. **Settings Integration Tests**: Test settings binding and updates
3. **UI Component Tests**: Test clock label updates and UI interactions
4. **E2E Tests**: Full extension testing in GNOME Shell environment
5. **Performance Tests**: Test performance under various conditions

## Test Development Guidelines

1. **Unit Tests**: Focus on pure functions without external dependencies
2. **Integration Tests**: Test component interactions using mocks
3. **Descriptive Names**: Use clear, descriptive test names
4. **Edge Cases**: Include tests for error conditions and edge cases
5. **Setup/Teardown**: Use proper setup and cleanup in tests

## Tools and Dependencies

- **Jest**: Test framework and test runner
- **ts-jest**: TypeScript integration for Jest
- **@types/jest**: TypeScript definitions for Jest
- **Custom Mocks**: Hand-written mocks for GNOME Shell APIs

The testing setup prioritizes testing the core business logic while acknowledging the complexity of testing GNOME Shell UI components directly.