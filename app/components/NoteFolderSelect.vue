<template>
    <div class="update-note__field">
        <label for="note-folder">Folder</label>
        <select id="note-folder" v-model="folderId" @focus="$emit('open')">
            <option :value="null">Tanpa folder</option>
            <option v-for="folder in folders" :key="folder.id" :value="folder.id">
                {{ folder.name }}
            </option>
        </select>
    </div>
</template>

<script setup>
defineProps({
    folders: { type: Array, default: () => [] },
})

defineEmits(['open'])

const folderId = defineModel('folderId', { default: null })
</script>