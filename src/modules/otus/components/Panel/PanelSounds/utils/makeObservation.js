import { ObservationTypes } from '../constants/observationTypes.js'
import { makeQualitativeObservation } from './makeQualitativeObservation.js'
import { makeContinuousObservation } from './makeContinuousObservation.js'
import { makeWorkingObservation } from './makeWorkingObservation.js'
import { makeMediaObservation } from './makeMediaObservation.js'
import { makeSampleObservation } from './makeSampleObservation.js'
import { makePresenceAbsenceObservation } from './makePresenceAbsenceObservation.js'

function makeObservationValue(obs) {
  switch (obs.type) {
    case ObservationTypes.Continuous:
      return makeContinuousObservation(obs)
    case ObservationTypes.Qualitative:
      return makeQualitativeObservation(obs)
    case ObservationTypes.Working:
      return makeWorkingObservation(obs)
    case ObservationTypes.Media:
      return makeMediaObservation(obs)
    case ObservationTypes.Sample:
      return makeSampleObservation(obs)
    case ObservationTypes.Presence:
      return makePresenceAbsenceObservation(obs)
    default:
      return {
        value:
          '<span class="text-warning">Observation type is not supported.</span>'
      }
  }
}

export function makeObservation(obs) {
  const descriptorName = obs.descriptor.name

  return {
    id: obs.id,
    type: obs.type,
    descriptorName,
    ...makeObservationValue(obs)
  }
}
