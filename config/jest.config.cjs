// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

module.exports = {
    preset: 'ts-jest/presets/default-esm',
    // Ensure <rootDir> points to the repository root (config/ is the config location)
    rootDir: '..',
    extensionsToTreatAsEsm: ['.ts'],
    testEnvironment: 'node',
    roots: ['<rootDir>/src/tests', '<rootDir>/src'],
    testMatch: ['**/src/tests/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            useESM: true,
            diagnostics: {
                warnOnly: true,
                ignoreCodes: [151001]
            }
        }],
    },
    moduleFileExtensions: ['ts', 'js', 'json'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/src/tests/**',
        '!**/dist/**',
        '!**/config/**',
        '!**/constants/**/index.ts',
        '!**/constants/**/extension.ts',
        '!**/constants/**/prefs.ts',
        '!src/extension.ts',
        '!src/ui/**',
        // Exclude GNOME Shell-only files from coverage to avoid errors in Node/test environment
        '!src/utils/gettext_utils_prefs.ts',
        '!src/utils/gettext_utils_ext.ts',
        '!src/prefs.ts',
    ],
    coverageDirectory: '<rootDir>/coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    testTimeout: 10000,
    
    // Memory-friendly settings for constrained environments
    maxWorkers: 1,              // Run tests sequentially, not in parallel
    logHeapUsage: false,        // Don't log heap usage (reduces overhead)
    detectLeaks: false,         // Skip leak detection to reduce memory usage
    workerIdleMemoryLimit: '512MB', // Kill workers if they use too much memory
};
