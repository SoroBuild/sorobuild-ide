import globals from 'globals';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';
export default [{ files: ['**/*.{js,jsx}'], languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: {...globals.browser, ...globals.node}, parserOptions: { ecmaFeatures: { jsx: true } } }, plugins: { react, 'react-hooks': hooks }, rules: { 'no-undef': 'error', 'no-unreachable': 'error', 'react/jsx-no-undef': 'error', 'react/jsx-key': 'error', 'react-hooks/rules-of-hooks': 'error' } }];
