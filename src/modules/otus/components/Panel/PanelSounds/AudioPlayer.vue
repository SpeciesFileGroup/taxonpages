<template>
  <div class="bg-base-foreground rounded shadow p-4">
    <div class="flex flex-col space-y-3">
      <div class="flex justify-between items-center gap-4 text-sm">
        <div>
          <h3
            class="font-medium first-letter:uppercase"
            v-html="title"
          />
        </div>
        <div class="text-base-lighter whitespace-nowrap">
          {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
        </div>
      </div>

      <div class="flex items-center gap-2">
        <a
          class="h-8 w-8 flex items-center justify-center rounded-full text-primary-content bg-primary-color"
          aria-label="Download"
          title="Download"
          :href="src"
          download
        >
          <IconDownload class="size-4" />
        </a>
        <SoundObservations :sound-id="soundId" />
        <button
          class="h-8 w-8 flex items-center justify-center rounded-full text-primary-content bg-primary-color"
          @click="togglePlay"
          :aria-label="isPlaying ? 'Pause' : 'Play'"
        >
          <IconPause
            v-if="isPlaying"
            class="size-4"
          />
          <IconPlay
            class="size-4"
            v-else
          />
        </button>

        <div class="flex-1">
          <input
            type="range"
            :value="currentTime"
            :max="duration"
            step="0.1"
            :style="sliderStyle"
            class="w-full h-2 text-base-lighter rounded-lg cursor-pointer appearance-none outline-none"
            aria-label="Seek time"
            @input="handleSeek"
          />
        </div>

        <button
          class="h-8 w-8 flex items-center justify-center rounded-full bg-primary-color text-primary-content"
          :aria-label="isMuted ? 'Unmute' : 'Mute'"
          @click="toggleMute"
        >
          <IconSpeakerX
            v-if="isMuted"
            class="size-4"
          />
          <IconSpeakerWave
            v-else
            class="size-4"
          />
        </button>

        <div class="w-20">
          <input
            type="range"
            :value="isMuted ? 0 : volume"
            max="1"
            step="0.01"
            @input="handleVolumeChange"
            class="w-full h-2 text-base-lighter rounded-lg appearance-none cursor-pointer"
            :style="volumeSliderStyle"
            aria-label="Volume"
          />
        </div>
      </div>

      <div
        v-if="copyright"
        class="text-xs text-base-lighter mt-2"
      >
        {{ copyright }}
      </div>
    </div>

    <audio
      ref="audioElement"
      :src="src"
      preload="metadata"
      @timeupdate="handleTimeUpdate"
      @loadedmetadata="handleLoadedMetadata"
      @ended="handleEnded"
    ></audio>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import SoundObservations from './components/SoundObservations.vue'

const props = defineProps({
  soundId: {
    type: Number,
    required: true
  },

  title: {
    type: String,
    default: 'Audio Track'
  },

  src: {
    type: String,
    required: true
  },

  copyright: {
    type: String,
    default: '© All rights reserved.'
  }
})

const audioElement = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.7)
const isMuted = ref(false)

const sliderStyle = computed(() => {
  const progress = (currentTime.value / duration.value) * 100

  return {
    '--progress': `${progress}%`,
    '--filled-color': 'rgb(var(--color-primary))',
    '--empty-color': 'rgb(var(--color-base-lighter))'
  }
})

const volumeSliderStyle = computed(() => ({
  '--progress': `${isMuted.value ? 0 : volume.value * 100}%`,
  '--filled-color': 'rgb(var(--color-primary))',
  '--empty-color': 'rgb(var(--color-base-lighter))'
}))

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

function togglePlay() {
  if (!audioElement.value) return

  if (isPlaying.value) {
    audioElement.value.pause()
  } else {
    audioElement.value.play()
  }

  isPlaying.value = !isPlaying.value
}

function handleTimeUpdate() {
  if (audioElement.value) {
    currentTime.value = audioElement.value.currentTime
  }
}

function handleSeek(event) {
  if (audioElement.value) {
    const newTime = parseFloat(event.target.value)
    audioElement.value.currentTime = newTime
    currentTime.value = newTime
  }
}

function handleVolumeChange(event) {
  if (audioElement.value) {
    const newVolume = parseFloat(event.target.value)
    audioElement.value.volume = newVolume
    volume.value = newVolume

    if (newVolume === 0) {
      isMuted.value = true
      audioElement.value.muted = true
    } else {
      isMuted.value = false
      audioElement.value.muted = false
    }
  }
}

function toggleMute() {
  if (audioElement.value) {
    audioElement.value.muted = !isMuted.value
    isMuted.value = !isMuted.value
  }
}

function handleLoadedMetadata() {
  if (audioElement.value) {
    duration.value = audioElement.value.duration
    audioElement.value.volume = volume.value
  }
}

function handleEnded() {
  isPlaying.value = false
  currentTime.value = 0

  if (audioElement.value) {
    audioElement.value.currentTime = 0
  }
}

onMounted(() => {
  if (audioElement.value) {
    audioElement.value.volume = volume.value
  }
})
</script>

<style scoped>
input[type='range'] {
  -webkit-appearance: none;
  height: 6px;
  background: rgb(var(--color-base-background));
  border-radius: 5px;
  background: linear-gradient(
    to right,
    var(--filled-color) 0%,
    var(--filled-color) var(--progress),
    var(--empty-color) var(--progress),
    var(--empty-color) 100%
  );
  background-repeat: no-repeat;
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 14px;
  width: 14px;
  border-radius: 50%;
  background: rgb(var(--color-primary));
  cursor: pointer;
}

input[type='range']::-moz-range-thumb {
  height: 14px;
  width: 14px;
  border-radius: 50%;
  background: rgb(var(--color-primary));
  cursor: pointer;
  border: none;
}
</style>
