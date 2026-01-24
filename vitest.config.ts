/**
 * Vitest Configuration
 *
 * Unit testing configuration for the LakeB2B Social Post Creator
 */

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'jsdom',

    // Setup files to run before each test file
    setupFiles: ['./tests/setupTests.ts'],

    // Test file patterns
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/unit/**/*.spec.{ts,tsx}'],

    // Exclude patterns
    exclude: ['node_modules', 'dist', '.next', 'tests/e2e/**'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
        '.next/**',
      ],
    },

    // Global test settings
    globals: true,

    // Timeout for each test
    testTimeout: 10000,

    // Watch mode settings
    watch: true,
    watchExclude: ['node_modules', '.next', 'coverage'],

    // Reporter options
    reporters: ['verbose'],

    // Mock settings
    mockReset: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
    },
  },
})
