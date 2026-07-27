<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="logo">
        <img src="/assets/images/logo.png" alt="Todo App">
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup>
import '~/assets/css/login.scss'
</script>