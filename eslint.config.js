import js from '@eslint/js'
import globals from 'globals'
import next from 'eslint-config-next/core-web-vitals'

const config = [
  { ignores: ['.next/**', 'out/**', 'node_modules/**', '.cache/**', '.venv-bayesflow/**'] },
  js.configs.recommended,
  ...next,
  {
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
  },
]

export default config
