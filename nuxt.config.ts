export default defineNuxtConfig({
  css: [
    '~/assets/css/main.scss',
    'vue-toastification/dist/index.css',
  ],

  build: {
    transpile: ['vue-toastification'],
  },

  runtimeConfig: {
    public: {
      apiBase: 'http://127.0.0.1:8000/api'
    }
  },

  modules: ['@nuxt/ui'],
})