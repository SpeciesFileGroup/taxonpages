export function makeSampleObservation(o) {
  const text = []

  if (o.sample_median) {
    text.push(`median = ${o.sample_median}`)
  }

  if (o.sample_mean) {
    text.push(`&#956; = ${o.sample_mean}`)
  }

  if (o.sample_standard_error) {
    text.push(`s = ${o.sample_standard_error} ${o.sample_units}`)
  }

  if (o.sample_n) {
    text.push(`${o.sample_n}`)
  }

  if (o.sample_standard_deviation) {
    text.push(`&#963; = ${o.sample_standard_deviation}`)
  }

  return {
    value: `${o.sample_min}-${o.sample_max} ${o.sample_units} (${text.join(
      ', '
    )})`
  }
}
