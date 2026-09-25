import { useEffect, useState } from 'react'
import { api } from './api.js'

export default function GoalDeadlineNotice({ goalId, refreshToken, onContinue, onEnd, estimatedEndAt }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [handled, setHandled] = useState(false)
  useEffect(() => {
    let cancelled = false
    let requestNumber = 0
    setData(null); setError(''); setHandled(false)
    async function refresh() {
      const current = ++requestNumber
      try {
        const value = await api.goalDeadline(goalId)
        if (!cancelled && current === requestNumber) { setData(value); setError('') }
      } catch (err) { if (!cancelled && current === requestNumber) setError(err.message) }
    }
    function visibleRefresh() { if (document.visibilityState === 'visible') refresh() }
    refresh()
    const interval = setInterval(visibleRefresh, 60000)
    document.addEventListener('visibilitychange', visibleRefresh)
    return () => { cancelled = true; clearInterval(interval); document.removeEventListener('visibilitychange', visibleRefresh) }
  }, [goalId, refreshToken])
  async function decide(handler) {
    if (!handler || busy) return
    setBusy(true)
    try { await handler(goalId); setHandled(true) }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  if (error && !data) return <p role="status">목표일 확인을 불러오지 못했습니다.</p>
  if (handled) return <p role="status">선택한 목표 처리가 반영되었습니다.</p>
  if (!data?.deadlineReached || !data.remainingTasks.length) return null
  return <section className="availability-editor" aria-label="목표일 안내">
    <h3>원래 목표일({data.targetDate})이 지났어요.</h3>
    <p>아직 학습하지 않은 항목이 {data.remainingTasks.length}개 있습니다.</p>
    <ul>{data.remainingTasks.map(task => <li key={task.taskId}>{task.title}</li>)}</ul>
    {estimatedEndAt && <p>예상 목표 종료 시각: {estimatedEndAt}</p>}
    <button type="button" disabled={busy || !onContinue} onClick={() => decide(onContinue)}>계속 학습</button>
    <button type="button" disabled={busy || !onEnd} onClick={() => { if (window.confirm('남은 학습 내용을 보존하고 이번 목표를 종료할까요?')) decide(onEnd) }}>이번 목표 종료</button>
    {error && <p role="alert">{error}</p>}
    <p>계속/종료 처리와 재배치 후 예상 종료일은 담당자 연결 후 제공됩니다. 기존 목표일과 수행 기록은 유지됩니다.</p>
  </section>
}
