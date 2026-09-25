export function clampPercentage(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.min(100, Math.max(0, number))
}

export function formatMinutes(minutes) {
  const total = Math.max(0, Number(minutes) || 0)
  const hours = Math.floor(total / 60)
  const remainder = total % 60
  if (!hours) return `${remainder}분`
  if (!remainder) return `${hours}시간`
  return `${hours}시간 ${remainder}분`
}

function currentKoreanDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
}

export function statisticsDateRange(goal, today = currentKoreanDate()) {
  if (!goal?.startDate || !goal?.targetDate) return null
  const endDate = today < goal.startDate
    ? goal.startDate
    : [today, goal.targetDate].sort()[0]
  return { startDate: goal.startDate, endDate }
}
