// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

module.exports = {
    preset: 'ts-jest/presets/default-esm',
    // Ensure <rootDir> points to the repository root (config/ is the config location)
    rootDir: '..',
    extensionsToTreatAsEsm: ['.ts'],
    testEnvironment: 'node',
    roots: ['<rootDir>/tests', '<rootDir>'],
    testMatch: ['**/tests/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
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
        '**/*.ts',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/tests/**',
        '!**/dist/**',
        '!**/config/**',
        '!**/constants/**/index.ts',
        '!**/constants/**/extension.ts',
        '!**/constants/**/prefs.ts',
        '!extension.ts',
        '!ui/**',
        // Exclude GNOME Shell-only files from coverage to avoid errors in Node/test environment
        '!utils/gettext_utils_prefs.ts',
        '!utils/gettext_utils_ext.ts',
        '!prefs.ts',
    ],
    coverageDirectory: '<rootDir>/coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
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
