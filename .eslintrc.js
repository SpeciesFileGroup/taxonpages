module.exports = {
  env: {
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
  ],
  globals: {
    defineEmits: true,
    defineProps: true,
    __APP_ENV__: true,
    __basedir: true
  },
  rules: {
    'vue/no-v-html': 'off'
  }
}