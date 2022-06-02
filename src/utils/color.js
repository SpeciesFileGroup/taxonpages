export const generateHue = index => {
  const PHI = (1 + Math.sqrt(5)) / 2
  const n = index * PHI - Math.floor(index * PHI)
  const h = Math.floor(n * 256)
  const s = Math.floor(n * 50) + 100
  const l = (Math.floor((n) + 1) * 60) + 10

  return `hsl(${h}, ${s}% , ${l}%)`
}
