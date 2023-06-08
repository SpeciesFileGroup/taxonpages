import { taxonResolver } from './nodes'

export function loadResolver(resolver) {
  switch (resolver) {
    case 'taxon':
      return taxonResolver
    default:
      return () => ({})
  }
}
