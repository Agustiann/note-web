<template>
    <div />
</template>
<script setup>
const token = useCookie('auth_token')
await navigateTo(token.value ? '/dashboard' : '/auth/login')
</script>