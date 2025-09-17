import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts'],
    ignores: ['dist/**', 'node_modules/**', '**/*.generated.ts', 'tests/**'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
      },
      globals: {
        // GNOME Shell global functions
        logError: 'readonly',
        log: 'readonly',
        print: 'readonly',
        printerr: 'readonly',
        imports: 'readonly',
        console: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Recommended ESLint rules
      ...js.configs.recommended.rules,

      // Basic TypeScript rules
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Allow console for development
      'no-console': 'off',

      // Turn off unused vars for function parameters (common in type definitions)
      'no-unused-vars': 'off',

      // Disable some rules that conflict with prettier
      'no-extra-semi': 'off',
    },
  },
  {
    files: ['tests/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
      },
      globals: {
        // Jest testing globals
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        global: 'readonly',
        console: 'readonly',
        require: 'readonly',
        // GNOME Shell global functions (for tests)
        logError: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Recommended ESLint rules
      ...js.configs.recommended.rules,

      // Basic TypeScript rules
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Allow console for development
      'no-console': 'off',

      // Turn off unused vars for function parameters
      'no-unused-vars': 'off',

      // Disable some rules that conflict with prettier
      'no-extra-semi': 'off',
    },
  },
  {
    files: ['spec/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
      },
      globals: {
        // Jasmine testing globals
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        spyOn: 'readonly',
        jasmine: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Recommended ESLint rules
      ...js.configs.recommended.rules,

      // Basic TypeScript rules
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Allow console for development
      'no-console': 'off',

      // Turn off unused vars for function parameters
      'no-unused-vars': 'off',

      // Disable some rules that conflict with prettier
      'no-extra-semi': 'off',
    },
  },
];