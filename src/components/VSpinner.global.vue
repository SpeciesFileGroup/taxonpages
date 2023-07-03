<template>
  <div
    ref="spinnerElement"
    class="box-spinner mx-spinner absolute bg-base-foreground opacity-90 h-full flex items-center"
    :style="cssProperties"
  >
    <div
      class="tw-spinner"
      :class="[`tw-spinner-${spinnerPosition}`]"
    >
      <svg
        v-if="showSpinner"
        :style="logoSize"
        aria-hidden="true"
        class="text-base-lighter animate-spin fill-primary-color"
        :class="logoClass"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
      <span class="sr-only">Loading...</span>

      <div
        v-if="legend.length"
        class="text-base-content text-center"
        :class="legendClass"
        :style="legendStyle"
      >
        <span
          v-if="showLegend"
          v-html="legend"
        />
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const FULL_SCREEN_STYLE = {
  position: 'fixed',
  width: '100vw',
  height: '100vh',
  top: '0px',
  left: '0px'
}

const props = defineProps({
  target: {
    type: String,
    default: undefined
  },

  fullScreen: {
    type: Boolean,
    default: false
  },

  legend: {
    type: String,
    default: 'Loading, please wait.'
  },

  resize: {
    type: Boolean,
    default: true
  },

  legendStyle: {
    type: Object,
    default: () => ({})
  },

  legendClass: {
    type: String,
    default: 'mt-5'
  },

  showLegend: {
    type: Boolean,
    default: true
  },

  showSpinner: {
    type: Boolean,
    default: true
  },

  spinnerPosition: {
    type: String,
    default: 'top'
  },

  logoSize: {
    type: Object,
    default: () => ({})
  },

  logoClass: {
    type: String,
    default: 'w-12 h-12'
  }
})

const spinnerElement = ref(null)
const cssProperties = ref({})
const resizeInterval = ref(undefined)

onMounted(() => {
  init()
  if (props.resize && !props.fullScreen) {
    checkResize()
  }
})

onUnmounted(() => clearInterval(resizeInterval.value))

const init = () => {
  const domElement = props.target
    ? document.querySelector(props.target)
    : spinnerElement.value.parentNode

  Object.assign(
    cssProperties.value,
    props.fullScreen ? FULL_SCREEN_STYLE : calculateSpinnerStyle(domElement)
  )
}

const calculateSpinnerStyle = (element) => {
  const size = element.getBoundingClientRect()
  const computedStyle = window.getComputedStyle(element, null)
  const paddingLeft = parseInt(
    computedStyle.getPropertyValue('padding-left'),
    10
  )
  const paddingRight = parseInt(
    computedStyle.getPropertyValue('padding-right'),
    10
  )
  const paddingTop = parseInt(computedStyle.getPropertyValue('padding-top'), 10)
  const paddingBottom = parseInt(
    computedStyle.getPropertyValue('padding-bottom'),
    10
  )

  return {
    position: 'absolute',
    width: size.width - paddingLeft - paddingRight + 'px',
    height: size.height - paddingTop - paddingBottom + 'px'
  }
}

const checkResize = () => {
  resizeInterval.value = setInterval(init(), 500)
}
</script>
<style lang="scss" scoped>
.tw-spinner {
  display: flex;
  margin: 0 auto;
  height: auto;
  width: auto;
  align-items: center;
  justify-content: center;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
.tw-spinner-left {
  flex-direction: row;
}
.tw-spinner-right {
  flex-direction: row-reverse;
}
.tw-spinner-top {
  flex-direction: column;
}
.tw-spinner-bottom {
  flex-direction: column-reverse;
}

.box-spinner {
  z-index: 4000;
}

.tw-spinner {
  font-size: 20px;
  overflow: hidden;
  width: 100%;
  position: relative;

  svg {
    display: block;
    position: relative;
    margin: 0px auto;
  }

  #Tail {
    opacity: 0;
    animation: tail 2s ease infinite;
    fill: #41ba8d;
  }
  #LeftBottom {
    fill: #00845d;
    opacity: 0;
    animation: spinner 1s ease alternate infinite;
    animation-delay: 0s;
  }
  #LeftMid {
    fill: #28221b;
    opacity: 0;
    animation: spinner 1s ease alternate infinite;
    animation-delay: 0.2s;
  }
  #LeftTop {
    fill: #342d25;
    opacity: 0;
    animation: spinner 1s ease alternate infinite;
    animation-delay: 0.4s;
  }
  #Head {
    fill: #342d25;
    opacity: 0;
    animation: spinner 1s ease alternate infinite;
    animation-delay: 0.6s;
  }

  @keyframes spinner {
    0% {
      opacity: 0;
    }
    30% {
      opacity: 0;
    }
    90% {
      opacity: 1;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes tail {
    0% {
      opacity: 0;
    }
    30% {
      opacity: 1;
    }
    50% {
      opacity: 1;
    }
    90% {
      opacity: 0;
    }
    100% {
      opacity: 0;
    }
  }
}
</style>
