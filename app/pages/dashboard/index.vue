<script setup lang="ts">
const api = useApi()

const response = ref()

onMounted(async () => {
  response.value = await api('/ping')
})
</script>

<template>
  <div>
    <h1>Nuxt + Laravel</h1>

    <pre>{{ response }}</pre>
  </div>
</template>