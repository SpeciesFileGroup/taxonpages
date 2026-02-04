function makeOriginalImageUrl(imagePath) {
  const { url, project_token } = __APP_ENV__

  return `${url}/${imagePath?.substring(8)}?project_token=${project_token}`
}

export function makeImageObject(item) {
  return {
    depiction: {
      label: item.figure_label
    },
    ...item.image,
    original: makeOriginalImageUrl(item.image.original_png)
  }
}
