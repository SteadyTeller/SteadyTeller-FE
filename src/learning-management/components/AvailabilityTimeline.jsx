import { useEffect, useRef, useState } from 'react'
import { Clock3, Plus, Save, X } from 'lucide-react'

const DAYS = [
  ['SUNDAY', '일'], ['MONDAY', '월'], ['TUESDAY', '화'], ['WEDNESDAY', '수'], ['THURSDAY', '목'], ['FRIDAY', '금'], ['SATURDAY', '토'],
]

const DEFAULT_TIME = { startTime: '19:00', endTime: '21:00' }

function makeDrafts() {
  return Object.fromEntries(DAYS.map(([dayOfWeek]) => [dayOfWeek, { ...DEFAULT_TIME }]))
}

function normalizeTime(time) {
  return String(time ?? '').slice(0, 5)
}

function overlaps(left, right) {
  return left.startTime < right.endTime && left.endTime > right.startTime
}

function windowKey(window) {
  return `${window.dayOfWeek}-${normalizeTime(window.startTime)}-${normalizeTime(window.endTime)}-${window.enabled !== false}`
}

export default function AvailabilityTimeline({ goalId, availabilities, onSave }) {
  const [windows, setWindows] = useState(availabilities)
  const [drafts, setDrafts] = useState(makeDrafts)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const previousGoalId = useRef(goalId)

  useEffect(() => {
    setWindows(availabilities)
    setError('')
    if (previousGoalId.current !== goalId) setSuccess(false)
    previousGoalId.current = goalId
  }, [goalId, availabilities])

  function updateDraft(dayOfWeek, key, value) {
    setDrafts(current => ({ ...current, [dayOfWeek]: { ...current[dayOfWeek], [key]: value } }))
  }

  function addWindow(dayOfWeek) {
    const draft = drafts[dayOfWeek]
    if (!draft.startTime || !draft.endTime || draft.endTime <= draft.startTime) {
      setError('종료 시간은 시작 시간보다 늦어야 합니다.')
      return
    }
    const nextWindow = { dayOfWeek, ...draft, enabled: true }
    if (windows.some(item => item.dayOfWeek === dayOfWeek && overlaps({ startTime: normalizeTime(item.startTime), endTime: normalizeTime(item.endTime) }, nextWindow))) {
      setError('같은 요일의 가용시간이 겹칩니다.')
      return
    }
    setWindows(current => [...current, nextWindow])
    setError('')
    setSuccess(false)
  }

  function removeWindow(index) {
    setWindows(current => current.filter((_, windowIndex) => windowIndex !== index))
    setSuccess(false)
  }

  async function save() {
    setError('')
    setSuccess(false)
    setIsSaving(true)
    try { await onSave(windows); setSuccess(true) } catch (requestError) { setError(requestError.message) } finally { setIsSaving(false) }
  }

  return <section className="availability-editor-card" aria-labelledby="availability-editor-title">
    <header className="availability-editor-heading"><div><p className="section-label">AVAILABILITY</p><h2 id="availability-editor-title">가용 시간</h2><span>요일별로 학습 가능한 시간대를 추가한 뒤 저장하세요.</span></div><button type="button" className="availability-save-button" onClick={save} disabled={isSaving}><Save size={15} /><span>{isSaving ? '저장 중...' : '가용시간 저장'}</span></button></header>
    <div className="availability-table" role="table"><div className="availability-table-head" role="row"><span role="columnheader">요일</span><span role="columnheader">가용 시간 입력</span><span role="columnheader">추가된 시간</span></div>{DAYS.map(([dayOfWeek, label]) => { const draft = drafts[dayOfWeek]; const dayWindows = windows.map((item, index) => ({ item, index })).filter(({ item }) => item.dayOfWeek === dayOfWeek && item.enabled !== false); return <div className="availability-table-row" role="row" key={dayOfWeek}><strong role="cell">{label}요일</strong><div className="availability-time-inputs" role="cell"><input type="time" aria-label={`${label}요일 시작 시간`} value={draft.startTime} onChange={event => updateDraft(dayOfWeek, 'startTime', event.target.value)} /><span>~</span><input type="time" aria-label={`${label}요일 종료 시간`} value={draft.endTime} onChange={event => updateDraft(dayOfWeek, 'endTime', event.target.value)} /><button type="button" onClick={() => addWindow(dayOfWeek)}><Plus size={14} />추가</button></div><div className="availability-window-list" role="cell">{dayWindows.length ? dayWindows.map(({ item, index }) => { const isSaved = availabilities.some(saved => windowKey(saved) === windowKey(item)); return <span className={isSaved ? 'saved' : 'pending'} key={`${item.startTime}-${item.endTime}-${index}`}>{normalizeTime(item.startTime)} ~ {normalizeTime(item.endTime)}<button type="button" aria-label={`${label}요일 ${normalizeTime(item.startTime)}부터 ${normalizeTime(item.endTime)}까지 삭제`} onClick={() => removeWindow(index)}><X size={12} /></button></span> }) : <small>등록된 시간이 없어요.</small>}</div></div>})}</div>
    <footer className="availability-editor-footer"><Clock3 size={13} /><span>입력한 시간은 목표별 가용시간으로 저장되며 일정 생성과 재계획에 사용됩니다.</span>{success && <em>가용시간이 저장되었습니다.</em>}{error && <strong>{error}</strong>}</footer>
  </section>
}
