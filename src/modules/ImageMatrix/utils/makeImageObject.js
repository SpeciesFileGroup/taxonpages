function makeOriginalImageUrl(imagePath) {
  const { url, project_token } = __APP_ENV__

  return `${url}/${imagePath?.substring(8)}?project_token=${project_token}`
}

export function makeImageObject(item) {
  console.log(item.attribution)
  return {
    depiction: {
      label: item.figure_label
    },

    attribution: { label: item.attribution },
    ...item.image,
    original: makeOriginalImageUrl(item.image.original_png)
  }
}
