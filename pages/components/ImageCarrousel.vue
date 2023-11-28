<template>
  <div class="overflow-hidden h-[550px] w-full">
    <img
      class="object-cover overflow-hidden h-[550px] w-full absolute"
      :key="currentImage.src"
      :src="currentImage.src"
      alt="Dichroplus maculipennis"
    />
    <div class="bg-black bg-opacity-25 absolute h-full w-full top-0">
      <slot />
    </div>
    <div class="absolute bottom-2 right-4">
      <span class="z-10 text-white text-sm drop-shadow">
        <RouterLink
          v-if="currentImage.otuId"
          class="text-white"
          :to="{ name: 'otus-id', params: { id: currentImage.otuId } }"
        >
          <i>{{ currentImage.label }}</i> © {{ currentImage.copyright }}
        </RouterLink>
      </span>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import lebinthusLuae from './images/lebinthusLuae.jpg'

const props = defineProps({
  duration: {
    type: Number,
    default: 5000
  }
})

const images = [
  {
    label: 'Acanthacris ruficornis citrina',
    copyright: 'Michel Lecoq',
    src: acanthacrisRuficornisCitrina,
    otuId: 819322
  },
  {
    label: 'Typophyllum inflatum',
    copyright: 'Holger Braun',
    src: typophyllumInflatum,
    otuId: 850435
  },
  {
    label: 'Xenicola dohrni',
    copyright: 'Holger Braun',
    src: xenicolaDohrni,
    otuId: 848543
  },
  {
    label: 'Lebinthus luae',
    copyright: 'Ming Kai Tan',
    src: lebinthusLuae,
    otuId: 831633
  },
  {
    label: 'Liladownsia fraile',
    copyright: 'Ricardo Mariño-Pérez',
    src: liladownsiaFraile,
    otuId: 816243
  },
  {
    label: 'Aerotegmina vociferator',
    copyright: 'Claudia Hemp',
    src: aerotegminaVociferator,
    otuId: 850176
  },
  {
    label: 'Chlorobalius leucoviridis',
    copyright: 'David Rentz',
    src: chlorobaliusLeucoviridis,
    otuId: 850075
  },

  {
    label: 'Chromacris speciosa',
    src: chromacrisSpeciosa,
    copyright: 'Cigliano, M.M',
    otuId: 823304
  },
  {
    label: 'Chibchacris fernandezi',
    src: chibchacrisFernandezi,
    copyright: 'Cigliano, M.M',
    otuId: 816353
  },
  {
    label: 'Coryacris angustipennis',
    src: coryacrisAngustipennis,
    copyright: 'Cigliano, M.M',
    otuId: 823314
  },
  {
    label: 'Stenopola puncticeps',
    copyright: 'Cigliano, M.M',
    src: stenopolaPuncticeps,
    otuId: 820284
  },
  {
    label: 'Zoniopoda tarsata',
    copyright: 'Cigliano, M.M',
    src: zoniopodaTarsata,
    otuId: 823378
  }
]

const currentIndex = ref(null)
const currentImage = computed(() => images[currentIndex.value] || {})

onMounted(() => {
  currentIndex.value = Math.floor(Math.random() * images.length)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s ease-in-out;
}
.fade-enter-from {
  opacity: 0;
}
.fade-enter-to {
  opacity: 1;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
