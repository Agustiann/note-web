<template>
    <NuxtLayout>
        <div class="update-note">

            <div class="update-note__header">
                <div class="update-note__header-actions">
                    <button class="update-note__delete" type="button" @click="handleCancel">
                        Batal
                    </button>
                    <button class="update-note__save" type="button" :disabled="isSaving" @click="handleSave">
                        {{ isSaving ? 'Menyimpan...' : 'Simpan Catatan' }}
                    </button>
                </div>
            </div>

            <div class="update-note__card">

                <div class="update-note__meta">
                    <div class="update-note__field">
                        <label>Folder</label>
                        <select v-model="form.folderId">
                            <option v-for="folder in folders" :key="folder.id" :value="folder.id">
                                {{ folder.name }}
                            </option>
                        </select>
                    </div>
                </div>

                <input v-model="form.title" class="update-note__title-input" placeholder="Judul...">

                <div class="update-note__body-header">
                    <label>Isi Catatan</label>

                    <div class="update-note__body-actions">
                        <button type="button" class="update-note__checklist-add" @click="addChecklistItem">
                            + Tambah checklist
                        </button>
                        <button type="button" class="update-note__image-add" @click="triggerImageUpload">
                            + Tambah gambar
                        </button>
                        <input ref="imageInputRef" type="file" accept="image/*" class="update-note__image-input"
                            @change="handleImageSelected">
                    </div>
                </div>

                <div ref="editorRef" class="update-note__editor" contenteditable="true" @input="handleEditorInput"
                    @keydown="handleEditorKeydown" @click="handleEditorClick" />

                <div class="update-note__footer">
                    <span v-if="saveError" class="update-note__error">
                        {{ saveError }}
                    </span>
                </div>

            </div>

        </div>
    </NuxtLayout>
</template>

<script setup>
const router = useRouter()

const folders = ref([
    { id: 1, name: 'Kerja' },
    { id: 2, name: 'Pribadi' },
    { id: 3, name: 'Belajar' },
])

const form = reactive({
    title: '',
    folderId: folders.value[0]?.id ?? null,
    content: '',
    checklist: [],
    images: [],
})

const isSaving = ref(false)
const saveError = ref('')
const editorRef = ref(null)

onMounted(async () => {
    await nextTick()

    if (editorRef.value) {
        editorRef.value.innerHTML = buildEditorHTML()
        placeCursorIn(editorRef.value)
    }
})

const escapeHtml = (text) => {
    const div = document.createElement('div')
    div.textContent = text ?? ''
    return div.innerHTML
}

const createChecklistId = () => `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const buildChecklistRowHTML = (item) => `
    <div class="update-note__row update-note__row--checklist${item.isCompleted ? ' update-note__row--done' : ''}" data-checklist-id="${item.id}">
        <span class="update-note__row-check" contenteditable="false">
            <input type="checkbox" ${item.isCompleted ? 'checked' : ''}>
        </span>
        <span class="update-note__row-text" contenteditable="true">${escapeHtml(item.content) || '<br>'}</span>
        <button type="button" class="update-note__row-remove" contenteditable="false">×</button>
    </div>
`.trim()

const buildTextRowHTML = (line) =>
    `<div class="update-note__row update-note__row--text">${escapeHtml(line) || '<br>'}</div>`

const buildEditorHTML = () => {
    const checklistHtml = form.checklist.map(buildChecklistRowHTML).join('')
    const textHtml = (form.content ? form.content.split('\n') : ['']).map(buildTextRowHTML).join('')

    return checklistHtml + textHtml
}

const parseEditorToForm = () => {
    if (!editorRef.value) return

    const rows = Array.from(editorRef.value.children)
    const textLines = []
    const checklistItems = []
    const images = []
    let position = 1

    rows.forEach((row) => {
        const imgEl = row.querySelector('img')
        if (imgEl) {
            images.push({
                id: row.dataset.imageId,
                src: imgEl.src,
                width: imgEl.style.width ? parseInt(imgEl.style.width, 10) : null,
                position: position++,
            })
            return
        }

        const checkboxEl = row.querySelector('input[type="checkbox"]')

        if (checkboxEl) {
            const textEl = row.querySelector('.update-note__row-text')

            checklistItems.push({
                id: row.dataset.checklistId || createChecklistId(),
                content: textEl ? textEl.innerText.trim() : '',
                isCompleted: checkboxEl.checked,
                position: position++,
            })
        } else {
            textLines.push(row.innerText)
        }
    })

    form.content = textLines.join('\n')
    form.checklist = checklistItems
    form.images = images
}

let parseTimeout = null
const handleEditorInput = () => {
    clearTimeout(parseTimeout)
    parseTimeout = setTimeout(parseEditorToForm, 300)
}

const createChecklistRowEl = (item) => {
    const row = document.createElement('div')
    row.className = 'update-note__row update-note__row--checklist'
    row.dataset.checklistId = item.id

    const checkWrap = document.createElement('span')
    checkWrap.className = 'update-note__row-check'
    checkWrap.setAttribute('contenteditable', 'false')

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = item.isCompleted
    checkWrap.appendChild(checkbox)

    const textSpan = document.createElement('span')
    textSpan.className = 'update-note__row-text'
    textSpan.setAttribute('contenteditable', 'true')

    if (item.content) {
        textSpan.textContent = item.content
    } else {
        textSpan.innerHTML = '<br>'
    }
    const removeBtn = document.createElement('button')
    removeBtn.type = 'button'
    removeBtn.className = 'update-note__row-remove'
    removeBtn.setAttribute('contenteditable', 'false')
    removeBtn.textContent = '×'

    row.append(checkWrap, textSpan, removeBtn)

    return row
}

const placeCursorIn = (el) => {
    if (!el) return
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
    el.focus()
}

const getCurrentRow = () => {
    const selection = window.getSelection()
    if (!selection || !selection.anchorNode) return null
    const anchorEl = selection.anchorNode.nodeType === 3
        ? selection.anchorNode.parentElement
        : selection.anchorNode
    return anchorEl?.closest('.update-note__row') ?? null
}

const addChecklistItem = () => {
    if (!editorRef.value) return

    const newRow = createChecklistRowEl({ id: createChecklistId(), content: '', isCompleted: false })
    const currentRow = getCurrentRow()

    if (currentRow && editorRef.value.contains(currentRow)) {
        currentRow.after(newRow)
    } else {
        editorRef.value.appendChild(newRow)
    }

    placeCursorIn(newRow.querySelector('.update-note__row-text'))
    parseEditorToForm()
}

const handleEditorKeydown = (e) => {
    if (e.key === 'Enter') {
        const row = getCurrentRow()
        if (!row || !row.classList.contains('update-note__row--checklist')) return

        e.preventDefault()

        const textSpan = row.querySelector('.update-note__row-text')
        const isEmpty = textSpan.innerText.trim() === ''

        if (isEmpty) {
            const textRow = document.createElement('div')
            textRow.className = 'update-note__row update-note__row--text'
            textRow.innerHTML = '<br>'
            row.replaceWith(textRow)
            placeCursorIn(textRow)
        } else {
            const newRow = createChecklistRowEl({ id: createChecklistId(), content: '', isCompleted: false })
            row.after(newRow)
            placeCursorIn(newRow.querySelector('.update-note__row-text'))
        }

        parseEditorToForm()
        return
    }

    if (e.key === 'Backspace') {
        const selection = window.getSelection()
        if (!selection || !selection.isCollapsed) return

        const anchorEl = selection.anchorNode?.nodeType === 3
            ? selection.anchorNode.parentElement
            : selection.anchorNode

        const textSpan = anchorEl?.closest('.update-note__row-text')
        if (!textSpan) return

        const row = textSpan.closest('.update-note__row--checklist')
        if (!row) return

        const atStart = selection.anchorOffset === 0
        const isEmpty = textSpan.innerText.trim() === ''
        if (!atStart && !isEmpty) return

        e.preventDefault()

        const prevRow = row.previousElementSibling
        row.remove()

        if (prevRow) {
            const prevText = prevRow.querySelector('.update-note__row-text') || prevRow
            placeCursorIn(prevText)
        }

        parseEditorToForm()
    }
}

const handleEditorClick = (e) => {
    const removeBtn = e.target.closest('.update-note__row-remove')
    if (removeBtn) {
        removeBtn.closest('.update-note__row')?.remove()
        parseEditorToForm()
        return
    }

    const checkbox = e.target.closest('input[type="checkbox"]')
    if (checkbox) {
        const row = checkbox.closest('.update-note__row')
        row.classList.toggle('update-note__row--done', checkbox.checked)
        parseEditorToForm()
    }
}

const handleSave = async () => {
    parseEditorToForm()

    if (!form.title.trim()) {
        saveError.value = 'Judul catatan tidak boleh kosong'
        return
    }

    saveError.value = ''
    isSaving.value = true

    try {
        await new Promise(resolve => setTimeout(resolve, 500))
        router.push('/notes')
    } catch (error) {
        saveError.value = 'Gagal membuat catatan, coba lagi'
    } finally {
        isSaving.value = false
    }
}

const handleCancel = () => {
    const hasContent = form.title.trim() || form.content.trim() || form.checklist.length || form.images.length
    if (hasContent) {
        const confirmed = confirm('Batalkan catatan ini? Perubahan yang belum disimpan akan hilang.')
        if (!confirmed) return
    }

    router.push('/notes')
}

const imageInputRef = ref(null)

const triggerImageUpload = () => {
    imageInputRef.value?.click()
}

const handleImageSelected = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''

    if (!file) return

    const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })

    insertImageRow(dataUrl)
}

const createImageRowEl = (src, id, width) => {
    const row = document.createElement('div')
    row.className = 'update-note__row update-note__row--image'
    row.dataset.imageId = id
    row.setAttribute('contenteditable', 'false')

    const img = document.createElement('img')
    img.src = src
    img.className = 'update-note__row-image'
    img.alt = ''
    if (width) img.style.width = `${width}px`

    const removeBtn = document.createElement('button')
    removeBtn.type = 'button'
    removeBtn.className = 'update-note__row-remove'
    removeBtn.setAttribute('contenteditable', 'false')
    removeBtn.textContent = '×'

    const resizeHandle = document.createElement('span')
    resizeHandle.className = 'update-note__row-resize'
    resizeHandle.setAttribute('contenteditable', 'false')

    row.append(img, removeBtn, resizeHandle)
    let startX = 0
    let startWidth = 0

    const onPointerMove = (e) => {
        const delta = e.clientX - startX
        const maxWidth = editorRef.value?.clientWidth || 9999
        const newWidth = Math.min(Math.max(startWidth + delta, 80), maxWidth)
        img.style.width = `${newWidth}px`
    }

    const onPointerUp = () => {
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
        parseEditorToForm()
    }

    resizeHandle.addEventListener('pointerdown', (e) => {
        e.preventDefault()
        e.stopPropagation()
        startX = e.clientX
        startWidth = img.getBoundingClientRect().width
        window.addEventListener('pointermove', onPointerMove)
        window.addEventListener('pointerup', onPointerUp)
    })

    return row
}

const insertImageRow = (src) => {
    if (!editorRef.value) return

    const newRow = createImageRowEl(src, createChecklistId())
    const currentRow = getCurrentRow()

    if (currentRow && editorRef.value.contains(currentRow)) {
        currentRow.after(newRow)
    } else {
        editorRef.value.appendChild(newRow)
    }

    let nextEditable = newRow.nextElementSibling
    if (!nextEditable) {
        nextEditable = document.createElement('div')
        nextEditable.className = 'update-note__row update-note__row--text'
        nextEditable.innerHTML = '<br>'
        newRow.after(nextEditable)
    }
    placeCursorIn(nextEditable)
    parseEditorToForm()
}
</script>