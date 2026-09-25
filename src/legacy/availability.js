export const fullDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
export function minutesFromTime(value) {
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(value ?? '')) return NaN
  const [hour, minute] = value.split(':').map(Number)
  return hour < 24 && minute < 60 ? hour * 60 + minute : NaN
}
export function timeFromMinutes(value) {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}
export function validateAvailability(request, existing) {
  const start = minutesFromTime(request.startTime)
  const end = minutesFromTime(request.endTime)
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) return '종료 시간은 시작 시간보다 늦어야 합니다. 자정을 넘는 구간은 나눠 입력해주세요.'
  if (existing.some(value => value.dayOfWeek === request.dayOfWeek && start < minutesFromTime(value.endTime) && end > minutesFromTime(value.startTime))) return '같은 요일의 기존 시간대와 겹칩니다.'
  return ''
}
