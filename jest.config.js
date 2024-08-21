module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['./jest.setup.js'],  // Add the setup file here
    moduleFileExtensions: ['ts', 'js'],
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            isolatedModules: true,
        }],
    },
    testMatch: ['**/tests/**/*.test.ts'],
};