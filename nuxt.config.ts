export default defineNuxtConfig({
  css: ['~/assets/css/main.scss'],

  runtimeConfig: {
    public: {
      apiBase: 'http://127.0.0.1:8000'
    }
  },

  modules: ['@nuxt/ui']
})