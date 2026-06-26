import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import configPrettier from 'eslint-config-prettier/flat'
import importPlugin from 'eslint-plugin-import'
import promise from 'eslint-plugin-promise'
import regex from 'eslint-plugin-regex'
import regexp from 'eslint-plugin-regexp'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'

export default defineConfig([
  globalIgnores(['coverage', 'dist', 'storybook-static']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      importPlugin.flatConfigs.recommended,
      promise.configs['flat/recommended'],
      regexp.configs['flat/recommended'],
      reactPlugin.configs.flat.recommended,
      reactPlugin.configs.flat['jsx-runtime'],
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
      parserOptions: { ecmaFeatures: { jsx: true } },
      sourceType: 'module',
    },
    plugins: {
      regex,
    },
    rules: {
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-unresolved': 'off',
      'import/order': 'off',
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'promise/always-return': 'off',
      'promise/catch-or-return': 'off',
      'react/prop-types': 'off',
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx'],
        },
      },
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['*.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  configPrettier,
])
