import { useEffect, useState } from 'react'
import { api } from './api.js'

/** Deadline extension UI. Extra time windows are managed in the existing availability editor. */
export default function GoalDeadlineNotice({ goalId, refreshToken, onContinued }) {
  const [deadline, setDeadline] = useState(null)
  const [newTargetDate, setNewTargetDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let active = true
    setDone(false); setError('')
    api.goalDeadline(goalId).then(value => active && setDeadline(value)).catch(err => active && setError(err.message))
    return () => { active = false }
  }, [goalId, refreshToken])

  async function continueLearning() {
    if (!newTargetDate || busy) return
    setBusy(true); setError('')
    try {
      const result = await api.continueGoal(goalId, { newTargetDate })
      setDone(true)
      if (onContinued) onContinued(result)
      else window.dispatchEvent(new CustomEvent('steadyTeller:goal-continued', { detail: result }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (error && !deadline) return <p role="alert">목표 마감 정보를 불러오지 못했습니다: {error}</p>
  if (done) return <section className="availability-editor"><strong>새 목표일로 남은 일정이 재계산되었습니다.</strong></section>
  if (!deadline?.deadlineReached || !deadline.remainingTasks?.length) return null

  return <section className="availability-editor" aria-label="목표 완료 예정일 안내">
    <h3>목표 완료 예정일이 지났습니다</h3>
    <p>아직 완료하지 않은 학습 내용이 {deadline.remainingTasks.length}개 있습니다.</p>
    <ul>{deadline.remainingTasks.map(task => <li key={task.taskId}>{task.title}</li>)}</ul>
    <p>계속 학습하려면 먼저 가용 시간대 설정에서 추가 시간을 등록하고, 새 목표일을 선택하세요.</p>
    <label>새 목표일
      <input type="date" min={deadline.targetDate} value={newTargetDate}
        onChange={event => setNewTargetDate(event.target.value)} />
    </label>
    <button type="button" disabled={!newTargetDate || busy} onClick={continueLearning}>
      {busy ? '남은 일정 재계산 중…' : '계속 학습하기'}
    </button>
    {error && <p role="alert">{error}</p>}
  </section>
}
