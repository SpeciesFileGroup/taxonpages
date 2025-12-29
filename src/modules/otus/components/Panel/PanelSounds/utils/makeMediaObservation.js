export function makeMediaObservation(observation) {
  return {
    value: observation.depictions.map((d) => `<img src="${d.image.thumb}">`)
  }
}
