/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.ts'],
    moduleNameMapper: {
        "^@clack/prompts$": "<rootDir>/tests/__mocks__/clack.js"
    }
};
