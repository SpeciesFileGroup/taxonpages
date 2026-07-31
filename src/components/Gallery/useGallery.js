import { ref, watch } from 'vue'
import { makeAPIRequest } from '@/utils'

export function useGallery({ props }) {
  const depictions = ref([])
  const citations = ref([])

  function makeGalleryImage(depiction) {
    return {
      id: depiction.id,
      imageId: depiction.image_id,
      objectId: depiction.depiction_object_id,
      objectType: depiction.depiction_object_type,
      objectLabel: depiction.depiction_object.label,
      label: depiction.label,
      imageOriginal: depiction.image.original,
      imageMedium: depiction.image.medium,
      attribution: depiction.attribution?.label || '',
      labelAttribution: [
        depiction.depiction_object.label,
        depiction.attribution?.label || ''
      ].join(' ')
    }
  }

  function loadCitations(imageIds) {
    if (!imageIds.length) {
      citations.value = []
      return
    }

    makeAPIRequest
      .get('/citations', {
        params: {
          citation_object_id: imageIds,
          citation_object_type: 'Image'
        }
      })
      .then(({ data }) => {
        citations.value = data
      })
      .catch(() => {})
  }

  watch(
    () => props.depictionId,
    (ids) => {
      if (ids.length) {
        makeAPIRequest
          .get('/depictions/gallery', {
            params: { depiction_id: ids }
          })
          .then(({ data }) => {
            depictions.value = data
              .map(makeGalleryImage)
              .sort(
                (a, b) =>
                  props.depictionId.indexOf(a.id) -
                  props.depictionId.indexOf(b.id)
              )

            if (props.citations) {
              loadCitations(depictions.value.map((image) => image.imageId))
            }
          })
          .catch(() => {})
      }
    },
    { immediate: true }
  )

  return {
    depictions,
    citations
  }
}
