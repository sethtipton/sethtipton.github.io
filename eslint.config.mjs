import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import astro from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const sharedGlobals = {
  ...globals.browser,
  ...globals.node,
};

const jsxA11yConfig = jsxA11y.flatConfigs.recommended;

export default [
  {
    ignores: ['.astro/', '.cache/', 'coverage/', 'dist/', 'node_modules/'],
  },
  {
    ...js.configs.recommended,
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      sourceType: 'module',
      globals: sharedGlobals,
    },
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      ...config.languageOptions,
      globals: {
        ...sharedGlobals,
        ...(config.languageOptions?.globals ?? {}),
      },
    },
  })),
  {
    files: ['**/*.tsx'],
    plugins: {
      ...jsxA11yConfig.plugins,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      ...jsxA11yConfig.languageOptions,
      globals: sharedGlobals,
      parserOptions: {
        ...jsxA11yConfig.languageOptions?.parserOptions,
        ecmaFeatures: {
          ...jsxA11yConfig.languageOptions?.parserOptions?.ecmaFeatures,
          jsx: true,
        },
      },
    },
    rules: {
      ...jsxA11yConfig.rules,
      ...reactHooks.configs.flat.recommended.rules,
    },
  },
  ...astro.configs['flat/recommended'].map((config) =>
    config.files
      ? {
          ...config,
          languageOptions: {
            ...config.languageOptions,
            globals: {
              ...sharedGlobals,
              ...(config.languageOptions?.globals ?? {}),
            },
          },
        }
      : config,
  ),
  {
    files: ['**/*.astro'],
    rules: {
      'astro/no-unused-css-selector': 'warn',
    },
  },
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
  eslintConfigPrettier,
];
