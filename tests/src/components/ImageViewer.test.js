// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ImageViewer from '@/components/ImageViewer/ImageViewer.global.vue'

const images = [
  { original: '/a.jpg', depictions: [] },
  { original: '/b.jpg', depictions: [] }
]

function mountViewer(props = {}) {
  return mount(ImageViewer, {
    props: { index: 0, images, next: true, ...props },
    attachTo: document.body,
    global: {
      mocks: { $t: (key) => key },
      stubs: {
        VSpinner: true,
        ImageAttribution: true,
        ImageDepictions: true,
        ImageSource: true,
        ImageViewerCounter: true,
        GalleryThumbnailList: true,
        ImageToolbar: true
      }
    }
  })
}

const pressKey = (key) => document.dispatchEvent(new KeyboardEvent('keyup', { key }))

describe('ImageViewer', () => {
  it('navigates and closes from the keyboard', () => {
    const wrapper = mountViewer()

    pressKey('ArrowRight')
    pressKey('ArrowLeft') // no previous image
    pressKey('Escape')

    expect(wrapper.emitted('next')).toHaveLength(1)
    expect(wrapper.emitted('previous')).toBeUndefined()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('stops listening to the keyboard once closed', () => {
    const wrapper = mountViewer()
    const emitted = wrapper.emitted()

    wrapper.unmount()
    pressKey('Escape')

    expect(emitted.close).toBeUndefined()
  })

  it('locks page scroll while open and returns focus when closed', () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()

    const wrapper = mountViewer()
    expect(document.body.classList.contains('overflow-hidden')).toBe(true)

    wrapper.unmount()
    expect(document.body.classList.contains('overflow-hidden')).toBe(false)
    expect(document.activeElement).toBe(opener)
  })
})
