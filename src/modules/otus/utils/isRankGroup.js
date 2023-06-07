export function isRankGrpup(compareRank, rank) {
  const rankGroup = rank.split('::').at(2)

  return rankGroup === compareRank
}
