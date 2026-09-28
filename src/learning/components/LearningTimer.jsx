import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, Pause, Play, Square, X } from 'lucide-react'
import { elapsedSeconds, formatElapsed, pauseTimer, readTimer, resumeTimer, timerStorageKey, validateResult, upsertDraft } from '../../legacy/timer.js'
import { isTimerResultApiUnavailable, learningApi } from '../api/learningApi.js'
import './LearningTimer.css'

const FAILURE_REASONS = [
  ['LACK_OF_TIME', '학습할 내용이 예상보다 많음'],
  ['DIFFICULTY_TOO_HIGH', '내용이 어려워 시간이 오래 걸림'],
  ['UNEXPECTED_EVENT', '개인 일정으로 학습하지 못함'],
  ['LACK_OF_FOCUS', '집중하지 못함'],
  ['OTHER', '기타'],
]

export default function LearningTimer({ memberId, item, onClose, onSaved }) {
  const storageKey = timerStorageKey(memberId)
  const existing = useMemo(() => readTimer(localStorage, storageKey), [storageKey])
  const [timer, setTimer] = useState(() => existing?.scheduleItemId === item.scheduleItemId ? existing : createTimer(item))
  const [now, setNow] = useState(Date.now())
  const [ending, setEnding] = useState(false)
  const [result, setResult] = useState('COMPLETED')
  const [reasonCode, setReasonCode] = useState('')
  const [reasonDetail, setReasonDetail] = useState('')
  const [learnedContent, setLearnedContent] = useState('')
  const [remainingContent, setRemainingContent] = useState('')
  const [actualMinutes, setActualMinutes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(timer))
  }, [storageKey, timer])

  const seconds = elapsedSeconds(timer, now)
  const overtime = seconds >= item.allocatedMinutes * 60

  function finishTimer() {
    const paused = pauseTimer(timer)
    setTimer(paused)
    setActualMinutes(String(Math.ceil(paused.elapsedSeconds / 60)))
    setEnding(true)
  }

  async function saveResult(event) {
    event.preventDefault()
    if (!validateResult(actualMinutes, result, reasonCode)) {
      setError('실제 학습 시간과 학습 결과를 확인해주세요.')
      return
    }
    setSaving(true)
    setError('')
    const payload = {
      attemptId: timer.attemptId,
      actualMinutes: Number(actualMinutes),
      result,
      reasonCode: result === 'FAILED' ? reasonCode : null,
      reasonDetail: result === 'FAILED' ? reasonDetail || null : null,
      learnedContent: learnedContent || null,
      remainingContent: result === 'FAILED' ? remainingContent || null : null,
    }
    try {
      if (result === 'COMPLETED') await learningApi.completeScheduleItem(item.scheduleId, item.scheduleItemId)
      else await learningApi.failScheduleItem(item.scheduleId, item.scheduleItemId, reasonCode, reasonDetail)

      let synced = true
      try {
        await learningApi.saveTimerResult(item.scheduleId, item.scheduleItemId, payload)
      } catch (timerError) {
        if (!isTimerResultApiUnavailable(timerError)) throw timerError
        synced = false
        saveOfflineDraft(memberId, item, payload, timer.elapsedSeconds)
      }
      localStorage.removeItem(storageKey)
      onSaved({ synced, result })
    } catch (saveError) {
      setError(saveError.message || '학습 결과를 저장하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="timer-backdrop" role="presentation">
    <section className="learning-timer-panel" role="dialog" aria-modal="true" aria-labelledby="timer-title">
      <header><div><span>{item.goalTitle}</span><h2 id="timer-title">{item.title}</h2></div><button type="button" aria-label="타이머 닫기" onClick={onClose}><X size={19} /></button></header>
      {!ending ? <div className="timer-running-view">
        <div className={overtime ? 'timer-clock overtime' : 'timer-clock'}><Clock3 size={21} /><output>{formatElapsed(seconds)}</output><small>예정 {item.allocatedMinutes}분</small></div>
        {overtime && <p className="timer-notice">예정 시간이 지났어요. 현재까지의 학습 결과를 확인해보세요.</p>}
        <div className="timer-actions">
          <button type="button" className="secondary-button" onClick={() => setTimer(current => current.runningSince == null ? resumeTimer(current) : pauseTimer(current))}>{timer.runningSince == null ? <Play size={17} /> : <Pause size={17} />}{timer.runningSince == null ? '계속하기' : '일시정지'}</button>
          <button type="button" className="primary-button" onClick={finishTimer}><Square size={16} />학습 종료</button>
        </div>
      </div> : <form className="timer-result-form" onSubmit={saveResult}>
        <div className="result-heading"><CheckCircle2 size={22} /><div><h3>오늘 학습은 어땠나요?</h3><p>결과를 남기면 다음 계획과 통계에 반영됩니다.</p></div></div>
        <div className="result-options">
          <label className={result === 'COMPLETED' ? 'selected' : ''}><input type="radio" name="result" value="COMPLETED" checked={result === 'COMPLETED'} onChange={event => setResult(event.target.value)} />완료했어요</label>
          <label className={result === 'FAILED' ? 'selected failed' : ''}><input type="radio" name="result" value="FAILED" checked={result === 'FAILED'} onChange={event => setResult(event.target.value)} />완료하지 못했어요</label>
        </div>
        <label className="form-field"><span>실제 학습 시간</span><div className="input-suffix"><input type="number" min="0" max="1440" value={actualMinutes} onChange={event => setActualMinutes(event.target.value)} required /><em>분</em></div></label>
        {result === 'FAILED' && <>
          <label className="form-field"><span>완료하지 못한 이유</span><select value={reasonCode} onChange={event => setReasonCode(event.target.value)} required><option value="">이유를 선택해주세요</option>{FAILURE_REASONS.map(([code, label]) => <option value={code} key={code}>{label}</option>)}</select></label>
          <label className="form-field"><span>남은 내용</span><textarea maxLength="2000" rows="2" placeholder="어디까지 남았는지 적어주세요." value={remainingContent} onChange={event => setRemainingContent(event.target.value)} /></label>
          <label className="form-field"><span>상세 이유 <small>선택</small></span><textarea maxLength="1000" rows="2" placeholder="다음 계획에 참고할 내용을 적어주세요." value={reasonDetail} onChange={event => setReasonDetail(event.target.value)} /></label>
        </>}
        <label className="form-field"><span>학습한 내용 <small>선택</small></span><textarea maxLength="2000" rows="2" placeholder="오늘 배운 내용을 간단히 기록해보세요." value={learnedContent} onChange={event => setLearnedContent(event.target.value)} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="timer-actions"><button type="button" className="secondary-button" disabled={saving} onClick={() => setEnding(false)}>타이머로 돌아가기</button><button className="primary-button" disabled={saving}>{saving ? '저장 중…' : '결과 저장'}</button></div>
      </form>}
    </section>
  </div>
}

function createTimer(item) {
  return { attemptId: crypto.randomUUID(), scheduleId: item.scheduleId, scheduleItemId: item.scheduleItemId, title: item.title, allocatedMinutes: item.allocatedMinutes, elapsedSeconds: 0, runningSince: Date.now() }
}

function saveOfflineDraft(memberId, item, payload, measuredSeconds) {
  const key = `steadyTeller.studyResultDrafts.v1.${memberId}`
  let drafts = []
  try {
    const stored = JSON.parse(localStorage.getItem(key) || '[]')
    if (Array.isArray(stored)) drafts = stored
  } catch {
    drafts = []
  }
  localStorage.setItem(key, JSON.stringify(upsertDraft(drafts, { ...payload, scheduleId: item.scheduleId, scheduleItemId: item.scheduleItemId, title: item.title, measuredSeconds, recordedAt: new Date().toISOString(), syncStatus: 'UNSENT' })))
}
