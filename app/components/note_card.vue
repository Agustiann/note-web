<template>
  <article class="note-card">
    <div v-if="note.checklists?.length" class="note-card__ring" :style="ringStyle">
      <span>{{ progressPercent }}%</span>
    </div>

    <div class="note-card__body">
      <div class="note-card__top">
        <h3 class="note-card__title">{{ note.title }}</h3>
        <span class="note-card__date">
          <span class="note-card__date-day">{{ formattedDate }}</span>
          <span class="note-card__date-time">{{ formattedTime }}</span>
        </span>
      </div>

      <p class="note-card__excerpt">{{ note.content }}</p>

      <div class="note-card__meta">
        <span v-if="note.folder" class="note-card__tag">
          <svg class="note-card__tag-icon" viewBox="0 0 20 20" fill="none">
            <path
              d="M2.5 5.5C2.5 4.67157 3.17157 4 4 4H7.17157C7.5694 4 7.9509 4.15804 8.23223 4.43934L9.29289 5.5H16C16.8284 5.5 17.5 6.17157 17.5 7V14.5C17.5 15.3284 16.8284 16 16 16H4C3.17157 16 2.5 15.3284 2.5 14.5V5.5Z"
              stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
          </svg>
          {{ note.folder.name }}
        </span>

        <span v-if="note.checklists?.length" class="note-card__stat">
          {{ completedCount }}/{{ note.checklists.length }} checklist
        </span>

        <span v-if="note.images?.length" class="note-card__stat">
          <svg viewBox="0 0 16 16" fill="none" class="note-card__stat-icon">
            <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" stroke-width="1.3" />
            <circle cx="5.2" cy="6.2" r="1.1" stroke="currentColor" stroke-width="1.1" />
            <path d="M2 11.5l3.3-3.2c.4-.4 1-.4 1.4 0l1.5 1.5 2.4-2.4c.4-.4 1-.4 1.4 0L14 9.4" stroke="currentColor"
              stroke-width="1.2" stroke-linecap="round" />
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
  dateField: {
    type: String,
    default: 'updated_at',
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

const formattedDate = computed(() => {
  const value = props.note[props.dateField]
  if (!value) return ''
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
})

const formattedTime = computed(() => {
  const value = props.note[props.dateField]
  if (!value) return ''
  return new Date(value).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
})
</script>