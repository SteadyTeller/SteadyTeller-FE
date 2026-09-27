import { useState } from 'react'
import { Check, Clock3, Pencil, Plus, RotateCcw, Sparkles, Trash2, X } from 'lucide-react'

const emptyTask = { title: '', category: '', subject: '', difficulty: 3, allocatedMinutes: 30 }

function scheduleLabel(schedule) {
  const date = new Date(`${schedule.date}T00:00:00`)
  const timeRange = schedule.endTime ? `${schedule.startTime} ~ ${schedule.endTime}` : schedule.startTime
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${timeRange}`
}

function CandidateTaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState(task ?? emptyTask)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const isEditing = Boolean(task)
  const update = (field, value) => setForm(current => ({ ...current, [field]: value }))

  async function submit(event) {
    event.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      await onSave({ title: form.title, category: form.category, subject: form.subject, difficulty: Number(form.difficulty), allocatedMinutes: Number(form.allocatedMinutes) })
      onClose()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return <div className="management-modal-backdrop" role="presentation" onMouseDown={onClose}>
    <form className="management-modal candidate-task-modal" onMouseDown={event => event.stopPropagation()} onSubmit={submit}>
      <button type="button" className="management-modal-close" aria-label="닫기" onClick={onClose}><X size={18} /></button>
      <p className="section-label">CANDIDATE TASK</p>
      <h2>{isEditing ? '후보 태스크 수정' : '후보 태스크 추가'}</h2>
      <p className="management-modal-description">확정 전까지 자유롭게 내용을 조정할 수 있습니다.</p>
      <label>태스크 이름<input required value={form.title} onChange={event => update('title', event.target.value)} /></label>
      <div className="management-form-grid">
        <label>분류<input required value={form.category} onChange={event => update('category', event.target.value)} /></label>
        <label>주제<input required value={form.subject} onChange={event => update('subject', event.target.value)} /></label>
      </div>
      <div className="management-form-grid">
        <label>난이도<select value={form.difficulty} onChange={event => update('difficulty', event.target.value)}>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <label>예상 시간(분)<input required min="1" type="number" value={form.allocatedMinutes} onChange={event => update('allocatedMinutes', event.target.value)} /></label>
      </div>
      {error && <p className="management-modal-error">{error}</p>}
      <div className="management-modal-actions"><button type="button" onClick={onClose}>취소</button><button type="submit" disabled={isSaving}>{isSaving ? '저장 중...' : isEditing ? '수정 저장' : '후보 추가'}</button></div>
    </form>
  </div>
}

export default function TaskList({ tasks, mode, availabilityMinutes, onGenerateTasks, onConfirmTasks, onCreateCandidate, onUpdateCandidate, onDeleteCandidate, onDeleteConfirmed, onUpdateConfirmedTaskCompletion, updatingTaskId, isGenerating, isConfirming, isTaskGenerationComplete, generationMessage }) {
  const [editingTask, setEditingTask] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deletingTaskId, setDeletingTaskId] = useState(null)
  const isCandidateMode = mode === 'candidate'
  const candidateMinutes = tasks.reduce((total, task) => total + (Number(task.allocatedMinutes) || 0), 0)

  async function deleteTask(task) {
    if (!window.confirm(`“${task.title}” 후보 태스크를 삭제할까요?`)) return
    setDeletingTaskId(task.id)
    try {
      await onDeleteCandidate(task.id)
    } finally {
      setDeletingTaskId(null)
    }
  }

  async function deleteConfirmedTask(task) {
    if (!window.confirm(`“${task.title}” 확정 태스크를 삭제할까요?`)) return
    setDeletingTaskId(task.id)
    try {
      await onDeleteConfirmed(task.id)
    } finally {
      setDeletingTaskId(null)
    }
  }

  async function updateCompletion(task, shouldComplete) {
    try {
      await onUpdateConfirmedTaskCompletion(task, shouldComplete)
    } catch {
      // The parent exposes the request error below the task list.
    }
  }

  return <section className="task-management-section" aria-labelledby="task-list-title">
    <header className="section-heading">
      <div><p className="section-label">{isCandidateMode ? 'CANDIDATE TASKS' : 'CONFIRMED TASKS'}</p><h2 id="task-list-title">태스크 목록</h2><span>{isCandidateMode ? '확정 전에 후보 태스크를 검토하고 편집하세요.' : '확정된 태스크는 배정된 일정과 함께 표시됩니다.'}</span>{isCandidateMode && <p className="candidate-capacity"><Clock3 size={13} /><span>후보 태스크 / 가용시간</span><strong>{candidateMinutes} / {availabilityMinutes}분</strong></p>}</div>
      <button type="button" className={`add-task-button${isTaskGenerationComplete ? ' complete' : ''}`} onClick={onGenerateTasks} disabled={isGenerating || isConfirming || isTaskGenerationComplete}><Sparkles size={16} />{isTaskGenerationComplete ? 'AI 태스크 생성 완료' : isGenerating ? '태스크 생성 중...' : 'AI 태스크 생성'}</button>
    </header>
    <div className="task-list-actions">
      {isCandidateMode && <><button type="button" className="candidate-action-button" onClick={() => setIsCreating(true)}><Plus size={15} />후보 추가</button><button type="button" className="confirm-task-button" onClick={onConfirmTasks} disabled={isConfirming}><Check size={15} />{isConfirming ? '확정 중...' : '태스크 확정'}</button></>}
    </div>
    <div className="task-management-list">
      {tasks.map(task => <article className={`managed-task ${task.status.toLowerCase()}${isCandidateMode ? ' candidate' : ''}`} key={task.id}>
        <div className="managed-task-copy"><div><h3>{task.title}</h3></div><span className="task-subject">{task.subject}</span><p>{task.allocatedMinutes}분</p>{task.schedules.length > 0 && <div className="task-schedules">{task.schedules.map(schedule => <span key={`${task.id}-${schedule.date}-${schedule.startTime}`}><i />{scheduleLabel(schedule)}</span>)}</div>}</div>
        {isCandidateMode && <div className="candidate-row-actions"><button type="button" aria-label={`${task.title} 수정`} onClick={() => setEditingTask(task)}><Pencil size={14} /></button><button type="button" aria-label={`${task.title} 삭제`} disabled={deletingTaskId === task.id} onClick={() => deleteTask(task)}><Trash2 size={14} /></button></div>}
        {!isCandidateMode && <div className="confirmed-row-actions">
          <button type="button" className={task.status === 'COMPLETED' ? 'confirmed-revert-button' : 'confirmed-complete-button'} disabled={!task.schedules.length || updatingTaskId === task.id} title={task.schedules.length ? undefined : '일정이 배정된 태스크만 완료 처리할 수 있습니다.'} onClick={() => updateCompletion(task, task.status !== 'COMPLETED')}>
            {task.status === 'COMPLETED' ? <RotateCcw size={13} /> : <Check size={13} />}{updatingTaskId === task.id ? '처리 중...' : task.status === 'COMPLETED' ? '미완료' : '완료'}
          </button>
          {task.status !== 'COMPLETED' && <button type="button" className="confirmed-delete-button" disabled={deletingTaskId === task.id || updatingTaskId === task.id} onClick={() => deleteConfirmedTask(task)}><Trash2 size={13} />{deletingTaskId === task.id ? '삭제 중...' : '삭제'}</button>}
        </div>}
      </article>)}
    </div>
    {generationMessage && <p className="task-generation-message">{generationMessage}</p>}
    {isCreating && <CandidateTaskModal onClose={() => setIsCreating(false)} onSave={onCreateCandidate} />}
    {editingTask && <CandidateTaskModal task={editingTask} onClose={() => setEditingTask(null)} onSave={payload => onUpdateCandidate(editingTask.id, payload)} />}
  </section>
}
