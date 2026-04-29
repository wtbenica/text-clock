// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later


// Coverage exclusion patterns
const baseExclusions = [
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/src/tests/**',
    '!**/dist/**',
    '!**/config/**',
];

const entryPointExclusions = [
    '!src/extension.ts',
    '!src/prefs.ts',
];

const constantsExclusions = [
    '!**/constants/**/index.ts',
    '!**/constants/**/extension.ts',
    '!**/constants/**/prefs.ts',
    '!src/constants/preferences.ts',
];

const gnomeRuntimeExclusions = [
    '!src/presentation/**',
    '!src/services/notification_service.ts',
    '!src/services/settings_manager.ts',
    '!src/services/system_settings_monitor.ts',
    '!src/services/style_service.ts',
];

const environmentDependentExclusions = [
    '!src/utils/gettext/gettext_utils_prefs.ts',
    '!src/utils/gettext/gettext_utils_ext.ts',
    '!src/utils/logging/logger_gjs.ts',
];

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
        ...baseExclusions,
        ...entryPointExclusions,
        ...constantsExclusions,
        ...gnomeRuntimeExclusions,
        ...environmentDependentExclusions,
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
