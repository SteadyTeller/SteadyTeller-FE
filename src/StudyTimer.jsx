import { useEffect, useState } from 'react'
import { elapsedSeconds, formatElapsed, pauseTimer, resumeTimer, timerStorageKey, readTimer, validateResult, upsertDraft } from './timer.js'
import './timer.css'

const reasons = ['학습량 과다', '내용이 어려움', '개인 일정', '집중하기 어려움', '기타']

// Result drafts remain local until the shared record API contract is agreed.
export default function StudyTimer({ memberId, item, onComplete, onSaveResult, onFinished }) {
  const key = timerStorageKey(memberId)
  const [timer, setTimer] = useState(() => readTimer(localStorage, key))
  const [now, setNow] = useState(Date.now())
  const [result, setResult] = useState(timer?.form?.result ?? 'COMPLETED')
  const [reason, setReason] = useState(timer?.form?.reason ?? '')
  const [learned, setLearned] = useState(timer?.form?.learned ?? '')
  const [remaining, setRemaining] = useState(timer?.form?.remaining ?? '')
  const [minutes, setMinutes] = useState(timer?.form?.minutes ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [ending, setEnding] = useState(timer?.form?.ending ?? false)

  useEffect(() => {
    if (!item || timer) return
    setResult('COMPLETED'); setReason(''); setLearned(''); setRemaining(''); setMinutes(''); setEnding(false); setError('')
    const value = { attemptId: crypto.randomUUID(), scheduleId: item.scheduleId, scheduleItemId: item.scheduleItemId, title: item.title, allocatedMinutes: item.allocatedMinutes, elapsedSeconds: 0, runningSince: Date.now(), notified: false }
    setTimer(value)
  }, [item, timer])
  useEffect(() => {
    if (!timer) return
    try { localStorage.setItem(key, JSON.stringify({ ...timer, form: { result, reason, learned, remaining, minutes, ending } })) }
    catch { setError('브라우저에 초안을 저장하지 못했습니다. 새로고침하면 기록이 사라질 수 있습니다.') }
  }, [timer, key, result, reason, learned, remaining, minutes, ending])
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])
  const seconds = elapsedSeconds(timer, now)
  useEffect(() => {
    if (timer && !timer.notified && seconds >= timer.allocatedMinutes * 60) {
      setTimer(current => ({ ...current, notified: true }))
    }
  }, [seconds, timer])
  if (!timer) return null

  function end() {
    const value = pauseTimer(timer)
    setTimer(value)
    setMinutes(String(Math.ceil(value.elapsedSeconds / 60)))
    setEnding(true)
  }
  async function save(event) {
    event.preventDefault()
    if (saving) return
    const actualMinutes = Number(minutes)
    if (!validateResult(minutes, result, reason)) return setError('학습 시간은 0~1440 사이 정수로 입력하고 실패 이유를 확인해주세요.')
    setSaving(true); setError('')
    try {
      const draftKey = `steadyTeller.studyResultDrafts.v1.${memberId}`
      const drafts = JSON.parse(localStorage.getItem(draftKey) || '[]')
      const draft = { attemptId: timer.attemptId, scheduleId: timer.scheduleId, scheduleItemId: timer.scheduleItemId, title: timer.title, actualMinutes, measuredSeconds: timer.elapsedSeconds, result, reason: result === 'FAILED' ? reason : null, learnedContent: learned, remainingContent: remaining, recordedAt: new Date().toISOString(), syncStatus: 'UNSENT' }
      localStorage.setItem(draftKey, JSON.stringify(upsertDraft(drafts, draft)))
      // Once the shared API exists, it must save the result and change status atomically.
      if (onSaveResult) {
        await onSaveResult(draft)
        localStorage.setItem(draftKey, JSON.stringify(upsertDraft(drafts, { ...draft, syncStatus: 'SENT' })))
      } else if (result === 'COMPLETED') {
        await onComplete(timer.scheduleId, timer.scheduleItemId)
      }
      localStorage.removeItem(key)
      setTimer(null)
      onFinished()
    } catch (err) { setError(err.message || '저장하지 못했습니다. 다시 시도해주세요.') }
    finally { setSaving(false) }
  }
  return <section className="study-timer" aria-label="학습 타이머">
    <strong>{timer.title}</strong>
    <output aria-label="측정 시간">{formatElapsed(seconds)}</output>
    <small>예정 {timer.allocatedMinutes}분 · 시간은 기기에서 측정합니다.</small>
    {timer.notified && <p role="status">예정 시간이 지났어요. 학습 결과를 확인해주세요. 타이머는 계속 측정됩니다.</p>}
    {!ending ? <div><button type="button" onClick={() => { setNow(Date.now()); setTimer(timer.runningSince == null ? resumeTimer(timer) : pauseTimer(timer)) }}>{timer.runningSince == null ? '재개' : '일시정지'}</button><button type="button" onClick={end}>종료·결과 입력</button></div> : <form onSubmit={save}>
      <label>실제 공부 시간(분)<input type="number" min="0" max="1440" step="1" required value={minutes} onChange={event => setMinutes(event.target.value)} /></label>
      <label>결과<select value={result} onChange={event => setResult(event.target.value)}><option value="COMPLETED">완료</option><option value="FAILED">완료하지 못함</option></select></label>
      {result === 'FAILED' && <><label>실패 이유<select required value={reason} onChange={event => setReason(event.target.value)}><option value="">선택해주세요</option>{reasons.map(value => <option key={value}>{value}</option>)}</select></label><label>남은 내용<textarea maxLength={2000} value={remaining} onChange={event => setRemaining(event.target.value)} /></label></>}
      <label>학습한 내용<textarea maxLength={2000} value={learned} onChange={event => setLearned(event.target.value)} /></label>
      {!onSaveResult && <p>시간·이유는 이 브라우저에 미전송 초안으로 보관됩니다. 실패 상태·통계·재배치에는 아직 반영되지 않습니다.</p>}
      {error && <p role="alert">{error}</p>}
      <button disabled={saving}>{saving ? '처리 중…' : onSaveResult ? '학습 결과 저장' : result === 'COMPLETED' ? '완료 처리·초안 보관' : '실패 초안 보관'}</button>
      <button type="button" disabled={saving} onClick={() => setEnding(false)}>돌아가기</button>
    </form>}
  </section>
}
