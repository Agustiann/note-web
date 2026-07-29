<template>
  <article class="note-card">
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
          <Folder class="note-card__tag-icon" :size="14" />
          {{ note.folder.name }}
        </span>

        <span v-if="note.checklists?.length" class="note-card__stat">
          {{ completedCount }}/{{ note.checklists.length }} checklist
        </span>

        <span v-if="note.images?.length" class="note-card__stat">
          <ImageIcon class="note-card__stat-icon" :size="14" />
          {{ note.images.length }}
        </span>
      </div>
    </div>
  </article>
</template>

<script setup>
import { Folder, Image as ImageIcon } from 'lucide-vue-next'

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

const formattedDate = useFormattedDate(
  () => props.note[props.dateField],
  'DD MMM YYYY'
)

const formattedTime = useFormattedDate(
  () => props.note[props.dateField],
  'HH:mm'
)
</script>