<template>
  <article class="note-card">
    <div class="note-card__ring" :style="ringStyle">
      <span>{{ progressPercent }}%</span>
    </div>

    <div class="note-card__body">
      <div class="note-card__top">
        <h3 class="note-card__title">{{ note.title }}</h3>
        <span class="note-card__date">{{ note.updatedAt }}</span>
      </div>

      <p class="note-card__excerpt">{{ note.content }}</p>

      <div class="note-card__meta">
        <span
          v-if="note.folder"
          class="note-card__tag"
          :style="{ background: note.folder.softColor, color: note.folder.color }"
        >
          <span class="note-card__tag-dot" :style="{ background: note.folder.color }" />
          {{ note.folder.name }}
        </span>

        <span v-if="note.checklists?.length" class="note-card__stat">
          {{ completedCount }}/{{ note.checklists.length }} checklist
        </span>

        <span v-if="note.images?.length" class="note-card__stat">
          <svg viewBox="0 0 16 16" fill="none" class="note-card__stat-icon">
            <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
            <circle cx="5.2" cy="6.2" r="1.1" stroke="currentColor" stroke-width="1.1"/>
            <path d="M2 11.5l3.3-3.2c.4-.4 1-.4 1.4 0l1.5 1.5 2.4-2.4c.4-.4 1-.4 1.4 0L14 9.4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          {{ note.images.length }}
        </span>
      </div>
    </div>
  </article>
</template>

<script setup>
const props = defineProps({
  note: {
    type: Object,
    required: true,
  },
})

const completedCount = computed(
  () => props.note.checklists?.filter((c) => c.is_completed).length ?? 0
)

const progressPercent = computed(() => {
  const total = props.note.checklists?.length ?? 0
  if (!total) return 0
  return Math.round((completedCount.value / total) * 100)
})

const ringStyle = computed(() => ({
  background: `conic-gradient(var(--color-accent) ${progressPercent.value}%, var(--color-border) 0)`,
}))
</script>