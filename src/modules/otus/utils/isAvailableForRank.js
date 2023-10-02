export function isAvailableForRank(available, rankString) {
  return (
    !available.length ||
    available.some((rankGroup) => rankString?.includes(rankGroup))
  )
}
