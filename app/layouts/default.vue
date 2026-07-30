<template>
  <div class="shell">
    <button
      v-if="!isSidebarOpen"
      type="button"
      class="shell__menu-toggle"
      aria-label="Buka menu"
      @click="openSidebar"
    >
      <Menu :size="20" />
    </button>

    <Transition name="overlay-fade">
      <div v-if="isSidebarOpen" class="shell__overlay" @click="closeSidebar" />
    </Transition>

    <AppSidebar />

    <main class="shell__main">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { Menu } from 'lucide-vue-next'

const { isOpen: isSidebarOpen, open: openSidebar, close: closeSidebar } = useSidebarUi()

const route = useRoute()
watch(() => route.fullPath, () => closeSidebar())
</script>