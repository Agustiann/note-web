<template>
    <div class="update-note__section">
        <div class="update-note__section-header">
            <label>Lampiran Gambar ({{ images.length }}/{{ maxImages }})</label>
            <button type="button" class="update-note__section-add" :disabled="images.length >= maxImages"
                @click="trigger">
                + Tambah gambar
            </button>
            <input ref="inputRef" type="file" accept="image/*" multiple class="update-note__image-input"
                @change="onChange">
        </div>

        <p class="update-note__hint">
            Maksimal {{ maxImages }} gambar, masing-masing maksimal {{ maxSizeLabel }}.
            <template v-if="extraHint">{{ ' ' + extraHint }}</template>
        </p>

        <span v-if="error" class="update-note__error">
            {{ error }}
        </span>

        <div v-if="images.length" class="update-note__attachment-grid">
            <div v-for="image in images" :key="image.id" class="update-note__attachment-item">
                <img :src="image.src" :alt="image.name" class="update-note__attachment-preview">
                <div class="update-note__attachment-meta">
                    <span class="update-note__attachment-name">{{ image.name }}</span>
                </div>
                <button type="button" class="update-note__attachment-remove" aria-label="Hapus gambar"
                    :disabled="image.isDeleting" @click="$emit('remove', image.id)">
                    ×
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    images: { type: Array, default: () => [] },
    maxImages: { type: Number, required: true },
    maxSizeLabel: { type: String, required: true },
    error: { type: String, default: '' },
    extraHint: { type: String, default: '' },
})

const emit = defineEmits(['select-files', 'remove'])

const inputRef = ref(null)

const trigger = () => {
    inputRef.value?.click()
}

const onChange = (e) => {
    const files = e.target.files
    if (files && files.length) emit('select-files', files)
    e.target.value = ''
}
</script>