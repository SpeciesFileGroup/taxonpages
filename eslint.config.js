import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'dist-ssr/**',
      'config/**',
      'pages/**',
      'components/**',
      'panels/**',
      'layouts/**',
      'public/**',
      'templates/**'
    ]
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
        __APP_ENV__: 'readonly',
        __basedir: 'readonly',
        __packageRoot: 'readonly'
      }
    },
    rules: {
      'vue/no-v-html': 'off'
    }
  },

  {
    files: ['**/*.vue'],
    rules: {
      'vue/attributes-order': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/html-indent': 'off',
      'vue/html-quotes': 'off',
      'vue/html-self-closing': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/singleline-html-element-content-newline': 'off'
    }
  }
]
