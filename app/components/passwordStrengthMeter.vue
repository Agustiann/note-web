<template>
    <div v-if="password" class="password-strength">
        <div class="password-strength__bar">
            <span v-for="n in 5" :key="n" class="password-strength__segment"
                :class="{ 'is-filled': n <= metCount }"
                :style="n <= metCount ? { background: barColor } : {}" />
        </div>

        <p class="password-strength__label" :style="{ color: barColor }">
            {{ label }}
        </p>

        <ul class="password-strength__rules">
            <li v-for="rule in rules" :key="rule.key" :class="{ 'is-met': rule.met }">
                <Check v-if="rule.met" :size="12" />
                <X v-else :size="12" />
                {{ rule.label }}
            </li>
        </ul>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { Check, X } from 'lucide-vue-next'

const props = defineProps({
    password: { type: String, default: '' },
})

const rules = computed(() => [
    { key: 'length', label: 'Minimal 8 karakter', met: props.password.length >= 8 },
    { key: 'lowercase', label: 'Huruf kecil', met: /[a-z]/.test(props.password) },
    { key: 'uppercase', label: 'Huruf besar', met: /[A-Z]/.test(props.password) },
    { key: 'number', label: 'Angka', met: /\d/.test(props.password) },
    { key: 'symbol', label: 'Simbol', met: /[^A-Za-z0-9]/.test(props.password) },
])

const metCount = computed(() => rules.value.filter((rule) => rule.met).length)

const label = computed(() => {
    if (metCount.value <= 1) return 'Lemah'
    if (metCount.value <= 3) return 'Sedang'
    if (metCount.value === 4) return 'Kuat'
    return 'Sangat Kuat'
})

const barColor = computed(() => {
    if (metCount.value <= 1) return 'var(--error)'
    if (metCount.value <= 3) return '#f0ad4e'
    if (metCount.value === 4) return '#2fb380'
    return '#1e9e63'
})
</script>

<style scoped>
.password-strength {
    margin-top: 6px;
    text-align: left;
}

.password-strength__bar {
    display: flex;
    gap: 4px;
}

.password-strength__segment {
    flex: 1;
    height: 4px;
    border-radius: 2px;
    background: var(--border);
    transition: background .2s ease;
}

.password-strength__label {
    font-size: 11px;
    font-weight: 600;
    margin: 4px 0 6px;
}

.password-strength__rules {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 4px 10px;
}

.password-strength__rules li {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--text-secondary);
}

.password-strength__rules li.is-met {
    color: var(--primary);
}
</style>