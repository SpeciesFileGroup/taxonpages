function makeOriginalPngUrl(imageUrl) {
  const { url, project_token } = __APP_ENV__

  return imageUrl
    ? `${url}/${imageUrl?.substring(8)}?project_token=${project_token}`
    : imageUrl
}

export function makeImage(depiction) {
  const { image } = depiction

  return {
    id: image.id,
    thumb: image.thumb,
    medium: image.medium,
    original: makeOriginalPngUrl(image.original_png),
    objectId: depiction.depiction_object_id,
    attribution: { label: depiction.attribution?.label || '' },
    source: { label: '' },
    depictions: depiction.figure_label
      ? [{ label: depiction.figure_label }]
      : []
  }
}
