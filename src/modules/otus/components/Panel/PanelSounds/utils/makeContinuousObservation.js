export function makeContinuousObservation(observation) {
  return {
    value: `${observation.continuous_value} ${observation.continuous_unit}`
  }
}
