<template>
  <div class="year-slider-container text-base-content">
    <div class="slider-wrapper">
      <div class="slider-track bg-base-muted">
        <div
          class="slider-range"
          :style="rangeStyle"
        ></div>

        <input
          class="slider-input slider-input-start"
          type="range"
          :min="props.min"
          :max="props.max"
          v-model.number="startYear"
          @input="updateRange"
        />

        <input
          class="slider-input slider-input-end"
          type="range"
          :min="props.min"
          :max="props.max"
          v-model.number="endYear"
          @input="updateRange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'

const props = defineProps({
  min: {
    type: Number,
    required: true
  },

  max: {
    type: Number,
    required: true
  }
})

const startYear = defineModel('start', {
  type: Number,
  required: true
})
const endYear = defineModel('end', {
  type: Number,
  required: true
})

const rangeStyle = computed(() => {
  const start = ((startYear.value - props.min) / (props.max - props.min)) * 100
  const end = ((endYear.value - props.min) / (props.max - props.min)) * 100

  return {
    left: `${Math.min(start, end)}%`,
    width: `${Math.abs(end - start)}%`
  }
})

const updateRange = () => {
  if (startYear.value > endYear.value) {
    ;[startYear.value, endYear.value] = [endYear.value, startYear.value]
  }
}

onMounted(() => {
  updateRange()
})
</script>

<style scoped>
.slider-wrapper {
  position: relative;
}

.slider-track {
  position: relative;
  height: 6px;
  border-radius: 3px;
  margin: 0.8rem 0;
}

.slider-range {
  position: absolute;
  height: 100%;
  background: rgb(var(--color-primary));
  border-radius: 3px;
  transition: all 0.2s ease;
}

.slider-input {
  position: absolute;
  width: 100%;
  height: 6px;
  background: transparent;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  touch-action: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: rgb(var(--color-primary));
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.slider-input::-webkit-slider-thumb:hover {
  background: rgb(var(--color-primary));
  transform: scale(1.1);
}

.slider-input::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: rgb(var(--color-primary));
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid rgb(var(--color-primary-content));
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.slider-input::-moz-range-thumb:hover {
  background: rgb(var(--color-primary));
  transform: scale(1.1);
}

.slider-input-end {
  pointer-events: none;
}

.slider-input-end::-webkit-slider-thumb {
  pointer-events: all;
}

.slider-input-end::-moz-range-thumb {
  pointer-events: all;
}
</style>
