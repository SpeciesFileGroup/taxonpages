<template>
  <div>
    <label class="block text-sm font-medium text-base-content mb-1.5">
      {{ label }}
    </label>
    <div class="flex flex-wrap gap-x-4 gap-y-2">
      <label
        v-for="group in RANK_GROUPS"
        :key="group.value"
        class="inline-flex items-center gap-2 cursor-pointer group"
      >
        <input
          type="checkbox"
          class="tp-checkbox"
          :checked="(modelValue || []).includes(group.value)"
          @change="toggle(group.value, $event.target.checked)"
        >
        <span class="text-sm text-base-content group-hover:text-secondary transition-colors select-none">
          {{ group.label }}
        </span>
      </label>
    </div>
    <p class="text-xs text-base-soft mt-1.5 leading-relaxed">
      If none are selected, this will be shown for all rank groups.
    </p>
  </div>
</template>

<script setup>
const RANK_GROUPS = [
  { value: 'HigherClassificationGroup', label: 'Higher Classification' },
  { value: 'FamilyGroup', label: 'Family' },
  { value: 'GenusGroup', label: 'Genus' },
  { value: 'SpeciesGroup', label: 'Species' },
  {
    value: 'SpeciesAndInfraspeciesGroup',
    label: 'Species & Infraspecies (ICN only)'
  }
]

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  label: { type: String, default: 'Visible for rank groups' }
})

const emit = defineEmits(['update:modelValue'])

function toggle(value, checked) {
  const current = [...(props.modelValue || [])]

  if (checked) {
    if (!current.includes(value)) {
      current.push(value)
    }
  } else {
    const idx = current.indexOf(value)
    if (idx !== -1) {
      current.splice(idx, 1)
    }
  }

  emit('update:modelValue', current.length ? current : undefined)
}
</script>
