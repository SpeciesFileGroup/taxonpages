function makeOriginalImageUrl(imagePath) {
  const { url, project_token } = __APP_ENV__

  return `${url}/${imagePath?.substring(8)}?project_token=${project_token}`
}

export function makeImageObject(item) {
  return {
    depictions: [
      {
        label: [item.figure_label, item.caption].filter(Boolean).join(' - ')
      }
    ],

    attribution: { label: item.attribution },
    ...item.image,
    original: makeOriginalImageUrl(item.image.original_png)
  }
}
