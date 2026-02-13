<template>
  <li class="border-b border-base-muted p-3 px-5">
    <AudioPlayer
      :sound-id="sound.id"
      :src="sound.sound_file"
      :title="sound.conveyances.map((c) => c.label).join('; ')"
      :copyright="sound.attribution.label"
    />
  </li>
</template>

<script setup>
import AudioPlayer from './AudioPlayer.vue'

defineProps({
  sound: {
    type: Object,
    required: true
  }
})
</script>
