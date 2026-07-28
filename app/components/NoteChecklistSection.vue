<template>
    <div class="update-note__section">
        <div class="update-note__section-header">
            <label>Checklist</label>
            <button type="button" class="update-note__section-add" @click="addItem">
                + Tambah checklist
            </button>
        </div>

        <p v-if="hint" class="update-note__hint">
            {{ hint }}
        </p>

        <span v-if="error" class="update-note__error">
            {{ error }}
        </span>

        <ul v-if="items.length" class="update-note__checklist">
            <li v-for="item in sortedItems" :key="item.id" class="update-note__checklist-item"
                :class="{ 'update-note__checklist-item--done': item.isCompleted }">
                <input v-model="item.isCompleted" type="checkbox" class="update-note__checklist-checkbox"
                    :disabled="item.isSaving || item.isDeleting" @change="$emit('toggle', item)">
                <input v-model="item.content" type="text" class="update-note__checklist-input"
                    placeholder="Item checklist..." :disabled="item.isDeleting"
                    :ref="(el) => setInputRef(el, item.id)" @keyup.enter="$emit('enter', item)"
                    @blur="$emit('blur', item)" @keydown.delete="handleBackspace(item, $event)">
                <button type="button" class="update-note__checklist-remove" aria-label="Hapus item"
                    :disabled="item.isDeleting" @click="$emit('remove', item.id)">
                    ×
                </button>
            </li>
        </ul>
        <p v-else class="update-note__empty-hint">
            Belum ada checklist.
        </p>
    </div>
</template>

<script setup>
const props = defineProps({
    items: { type: Array, default: () => [] },
    hint: { type: String, default: '' },
    error: { type: String, default: '' },
})

const emit = defineEmits(['enter', 'blur', 'toggle', 'remove'])

const sortedItems = computed(() => {
    return [...props.items].sort((a, b) => {
        if (a.isCompleted === b.isCompleted) return 0
        return a.isCompleted ? 1 : -1
    })
})

const inputRefs = {}
const setInputRef = (el, id) => {
    if (el) inputRefs[id] = el
    else delete inputRefs[id]
}

const focusInputEnd = (id) => {
    nextTick(() => {
        const el = inputRefs[id]
        if (!el) return
        el.focus()
        const len = el.value.length
        el.setSelectionRange(len, len)
    })
}

const addItem = () => {
    const item = {
        id: useTempId(),
        content: '',
        isCompleted: false,
        isSaving: false,
        isDeleting: false,
    }
    props.items.push(item)
    nextTick(() => {
        inputRefs[item.id]?.focus()
    })
    return item
}

const handleBackspace = (item, e) => {
    if (item.content !== '') return
    e.preventDefault()

    const list = sortedItems.value
    const index = list.findIndex(i => i.id === item.id)
    const previous = index > 0 ? list[index - 1] : null

    if (previous) {
        focusInputEnd(previous.id)
    }

    emit('remove', item.id)
}

defineExpose({ addItem })
</script>