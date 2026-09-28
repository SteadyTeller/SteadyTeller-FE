import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, Check, GripVertical, Pencil, Plus, Trash2, X } from 'lucide-react'
import AvailabilityTimeline from './AvailabilityTimeline.jsx'

const emptyCandidate = { title: '', category: '', subject: '', difficulty: 3, allocatedMinutes: 30 }

function minutesLabel(minutes) {
  if (!Number.isFinite(minutes)) return '계산 중'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours ? `${hours}시간${rest ? ` ${rest}분` : ''}` : `${rest}분`
}

function localDate() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function editableDaysForPeriod(startDate, targetDate) {
  if (!startDate || !targetDate || startDate > targetDate) return []
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  const days = new Set()
  const cursor = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${targetDate}T00:00:00`)
  while (cursor <= end) {
    days.add(dayNames[cursor.getDay()])
    cursor.setDate(cursor.getDate() + 1)
  }
  return [...days]
}

function ReplanCandidateForm({ candidate, onClose, onSave }) {
  const [form, setForm] = useState(candidate ?? emptyCandidate)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const isEditing = Boolean(candidate)
  const update = (field, value) => setForm(current => ({ ...current, [field]: value }))

  async function submit(event) {
    event.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      await onSave({ ...form, difficulty: Number(form.difficulty), allocatedMinutes: Number(form.allocatedMinutes) })
      onClose()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return <div className="management-modal-backdrop replan-candidate-backdrop" role="presentation" onMouseDown={event => { event.stopPropagation(); onClose() }}>
    <form className="management-modal candidate-task-modal" onMouseDown={event => event.stopPropagation()} onSubmit={submit}>
      <button type="button" className="management-modal-close" aria-label="창 닫기" onClick={onClose}><X size={18} /></button>
      <p className="section-label">EXPECTED TASK</p>
      <h2>{isEditing ? '예상 태스크 수정' : '예상 태스크 추가'}</h2>
      <p className="management-modal-description">확정 전까지 예상 태스크의 내용과 시간을 조정할 수 있어요.</p>
      <label>태스크 이름<input required value={form.title} onChange={event => update('title', event.target.value)} /></label>
      <div className="management-form-grid"><label>분류<input required value={form.category} onChange={event => update('category', event.target.value)} /></label><label>주제<input required value={form.subject} onChange={event => update('subject', event.target.value)} /></label></div>
      <div className="management-form-grid"><label>난이도<select value={form.difficulty} onChange={event => update('difficulty', event.target.value)}>{[1, 2, 3, 4, 5].map(value => <option value={value} key={value}>{value}</option>)}</select></label><label>예상 시간(분)<input required min="1" max="1440" type="number" value={form.allocatedMinutes} onChange={event => update('allocatedMinutes', event.target.value)} /></label></div>
      {error && <p className="management-modal-error">{error}</p>}
      <div className="management-modal-actions"><button type="button" onClick={onClose}>취소</button><button type="submit" disabled={isSaving}>{isSaving ? '저장 중...' : isEditing ? '수정 저장' : '태스크 추가'}</button></div>
    </form>
  </div>
}

export default function ReplanModal({ goal, availabilities, onClose, onCreateProposal, onCancelProposal, onCreateCandidate, onUpdateCandidate, onDeleteCandidate, onGetCapacity, onConfirmProposal }) {
  const [replanAvailabilities, setReplanAvailabilities] = useState(availabilities)
  const [targetDate, setTargetDate] = useState(goal.targetDate ?? '')
  const [proposal, setProposal] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [capacity, setCapacity] = useState(null)
  const [editingCandidate, setEditingCandidate] = useState(null)
  const [draggedCandidateId, setDraggedCandidateId] = useState(null)
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const minimumTargetDate = [goal.startDate, localDate()].filter(Boolean).sort().at(-1)
  const replanEditableDays = useMemo(() => editableDaysForPeriod(minimumTargetDate, targetDate), [minimumTargetDate, targetDate])
  const busy = isGenerating || isCancelling || isConfirming

  useEffect(() => {
    setReplanAvailabilities(current => current.filter(availability => replanEditableDays.includes(availability.dayOfWeek)))
  }, [replanEditableDays])

  async function refreshCapacity() {
    setCapacity(await onGetCapacity())
  }

  async function generateProposal() {
    if (!targetDate || targetDate < minimumTargetDate) {
      setError(`목표일은 ${minimumTargetDate} 이후로 설정해주세요.`)
      return
    }
    setError('')
    setIsGenerating(true)
    try {
      const availabilitiesForPeriod = replanAvailabilities.filter(availability => replanEditableDays.includes(availability.dayOfWeek))
      const nextProposal = await onCreateProposal({ targetDate, availabilities: availabilitiesForPeriod })
      setProposal(nextProposal.summary)
      setCandidates(nextProposal.candidates ?? [])
      setCapacity(nextProposal.capacity ?? null)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsGenerating(false)
    }
  }

  function moveCandidate(targetId) {
    if (!draggedCandidateId || draggedCandidateId === targetId) return
    setCandidates(current => {
      const sourceIndex = current.findIndex(candidate => candidate.id === draggedCandidateId)
      const targetIndex = current.findIndex(candidate => candidate.id === targetId)
      if (sourceIndex < 0 || targetIndex < 0) return current
      const next = [...current]
      const [candidate] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, candidate)
      return next
    })
  }

  async function saveCandidate(payload) {
    const isEditing = editingCandidate && editingCandidate !== 'new'
    const saved = isEditing ? await onUpdateCandidate(editingCandidate.id, payload) : await onCreateCandidate(payload)
    setCandidates(current => isEditing ? current.map(candidate => candidate.id === saved.id ? saved : candidate) : [...current, saved])
    await refreshCapacity()
  }

  async function deleteCandidate(candidateId) {
    setError('')
    try {
      await onDeleteCandidate(candidateId)
      setCandidates(current => current.filter(candidate => candidate.id !== candidateId))
      await refreshCapacity()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function confirmProposal() {
    setError('')
    setIsConfirming(true)
    try {
      await onConfirmProposal()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsConfirming(false)
    }
  }

  async function cancel() {
    if (!proposal) return onClose()
    setError('')
    setIsCancelling(true)
    try {
      await onCancelProposal()
      onClose()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsCancelling(false)
    }
  }

  return <div className="management-modal-backdrop" role="presentation" onMouseDown={cancel}>
    <section className="management-modal replan-modal" role="dialog" aria-modal="true" aria-labelledby="replan-form-title" onMouseDown={event => event.stopPropagation()}>
      <button type="button" className="management-modal-close" aria-label="창 닫기" onClick={cancel} disabled={busy}><X size={18} /></button>
      <div className="management-modal-icon"><CalendarClock size={21} /></div>
      <p className="section-label">TIME RESCHEDULING</p>
      <h2 id="replan-form-title">시간 재조정</h2>
      <p className="management-modal-description">가용시간을 변경해, 완료하지 않은 태스크들을 새로 배치할 수 있어요.</p>
      <div className="replan-form">
        <div className="replan-availability-editor">
          <section className="replan-period-editor" aria-labelledby="replan-period-title"><div><p className="section-label">TARGET PERIOD</p><strong id="replan-period-title">목표 기간</strong><span>시작일은 유지하고 목표일을 조정할 수 있어요.</span></div><label>새 목표일<input type="date" value={targetDate} min={minimumTargetDate} onChange={event => setTargetDate(event.target.value)} disabled={busy} /></label></section>
          <AvailabilityTimeline goalId={goal.id} availabilities={replanAvailabilities} editableDays={replanEditableDays} onChange={setReplanAvailabilities} showSaveButton={false} onSave={async () => {}} headerAction={<button type="button" className="replan-generate-button" onClick={generateProposal} disabled={busy}>{isGenerating ? '생성 중...' : '예상 태스크 생성'}</button>} />
        </div>
        <section className="replan-preview" aria-labelledby="replan-preview-title">
          <header className="replan-preview-heading"><div><p className="section-label">DRAFT PLAN</p><h2 id="replan-preview-title">예상 태스크 및 일정 변경</h2><span>태스크를 드래그해 원하는 순서로 살펴볼 수 있어요.</span></div>{proposal && <strong>{candidates.length}개 태스크</strong>}</header>
          {!proposal && <div className="replan-preview-empty"><CalendarClock size={22} /><strong>아직 생성된 예상 태스크가 없어요.</strong><span>왼쪽에서 가용시간을 입력한 뒤 예상 태스크를 생성해주세요.</span></div>}
          {proposal && <>
            <div className="replan-capacity-summary"><span>새 목표일 <strong>{proposal.targetDate}</strong></span><span>가용시간 <strong>{minutesLabel(capacity?.totalAvailableMinutes)}</strong></span><span>예상 배정 <strong>{minutesLabel(capacity?.totalCandidateAllocatedMinutes)}</strong></span></div>
            <div className="replan-candidate-list" aria-label="예상 태스크 목록">{candidates.map(candidate => <article className="replan-candidate" draggable key={candidate.id} onDragStart={() => setDraggedCandidateId(candidate.id)} onDragOver={event => event.preventDefault()} onDrop={() => { moveCandidate(candidate.id); setDraggedCandidateId(null) }} onDragEnd={() => setDraggedCandidateId(null)}><GripVertical size={16} aria-hidden="true" /><div><strong>{candidate.title}</strong><span>{candidate.subject || candidate.category || '학습 태스크'} · {minutesLabel(candidate.allocatedMinutes)}</span></div><div className="replan-candidate-actions"><button type="button" aria-label={`${candidate.title} 수정`} onClick={() => setEditingCandidate(candidate)}><Pencil size={13} /></button><button type="button" aria-label={`${candidate.title} 삭제`} onClick={() => deleteCandidate(candidate.id)}><Trash2 size={13} /></button></div></article>)}</div>
            <div className="replan-preview-actions"><button type="button" className="candidate-action-button" onClick={() => setEditingCandidate('new')} disabled={busy}><Plus size={15} />예상 태스크 추가</button><button type="button" className="confirm-task-button" onClick={confirmProposal} disabled={busy || !candidates.length || capacity?.isWithinAvailability === false}><Check size={15} />{isConfirming ? '확정 중...' : '확정 및 일정 생성'}</button></div>
            <p className="replan-schedule-note">확정하면 현재 목표의 미완료 태스크와 일정이 이 초안으로 교체됩니다.</p>
          </>}
        </section>
        {error && <p className="management-modal-error">{error}</p>}
        <div className="management-modal-actions replan-modal-actions"><button type="button" onClick={cancel} disabled={busy}>{isCancelling ? '취소 중...' : '취소'}</button></div>
      </div>
    </section>
    {editingCandidate && <ReplanCandidateForm candidate={editingCandidate === 'new' ? null : editingCandidate} onClose={() => setEditingCandidate(null)} onSave={saveCandidate} />}
  </div>
}
