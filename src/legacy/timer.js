export function elapsedSeconds(timer, now = Date.now()) {
  if (!timer) return 0
  return Math.max(0, timer.elapsedSeconds + (timer.runningSince == null ? 0 : Math.floor(Math.max(0, now - timer.runningSince) / 1000)))
}

export function pauseTimer(timer, now = Date.now()) {
  return { ...timer, elapsedSeconds: elapsedSeconds(timer, now), runningSince: null }
}

export function resumeTimer(timer, now = Date.now()) {
  return timer.runningSince == null ? { ...timer, runningSince: now } : timer
}

export function formatElapsed(seconds) {
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(value => String(value).padStart(2, '0')).join(':')
}

export function timerStorageKey(memberId) {
  return `steadyTeller.timerDraft.v1.${memberId}`
}

export function readTimer(storage, key) {
  try {
    const value = JSON.parse(storage.getItem(key))
    if (!value || typeof value.attemptId !== 'string' || !Number.isInteger(value.scheduleId)
      || !Number.isInteger(value.scheduleItemId) || !Number.isFinite(value.elapsedSeconds)
      || value.elapsedSeconds < 0 || !Number.isFinite(value.allocatedMinutes) || value.allocatedMinutes <= 0
      || (value.runningSince !== null && !Number.isFinite(value.runningSince))) return null
    return value
  } catch { return null }
}

export function validateResult(minutes, result, reason) {
  const value = Number(minutes)
  return String(minutes).trim() !== '' && Number.isInteger(value) && value >= 0 && value <= 1440
    && ['COMPLETED', 'FAILED'].includes(result) && (result !== 'FAILED' || Boolean(reason))
}

export function upsertDraft(drafts, draft) {
  if (!Array.isArray(drafts)) throw new Error('기존 초안을 읽을 수 없습니다. 저장소를 확인해주세요.')
  return [...drafts.filter(value => value.attemptId !== draft.attemptId), draft]
}
