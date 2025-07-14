export function makePresenceAbsenceObservation(o) {
  return {
    value: o.presence ? '&#10003;' : '&#x274c;'
  }
}
