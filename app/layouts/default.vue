<template>
  <div class="shell">
    <button type="button" class="shell__menu-toggle" :class="{ 'shell__menu-toggle--open': isSidebarOpen }"
      :aria-expanded="isSidebarOpen" aria-label="Buka atau tutup menu" @click="toggleSidebar">
      <Menu v-if="!isSidebarOpen" :size="20" />
      <X v-else :size="20" />
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
import { Menu, X } from 'lucide-vue-next'

const { isOpen: isSidebarOpen, close: closeSidebar, toggle: toggleSidebar } = useSidebarUi()

const route = useRoute()
watch(() => route.fullPath, () => closeSidebar())
</script>