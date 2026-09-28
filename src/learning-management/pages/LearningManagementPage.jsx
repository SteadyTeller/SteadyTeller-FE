import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import GoalManagementCard from '../components/GoalManagementCard.jsx'
import GoalFormModal from '../components/GoalFormModal.jsx'
import AvailabilityTimeline from '../components/AvailabilityTimeline.jsx'
import MonthlyScheduleCalendar from '../components/MonthlyScheduleCalendar.jsx'
import ReplanModal from '../components/ReplanModal.jsx'
import TaskList from '../components/TaskList.jsx'
import { learningManagementApi } from '../api/learningManagementApi.js'
import '../learning-management.css'

function toGoalView(goal) {
  return {
    ...goal,
    description: goal.mustStudyTopics?.length ? `${goal.mustStudyTopics.join(' · ')}을 중심으로 학습합니다.` : '학습 목표를 설정하세요.',
    mustStudyTopics: goal.mustStudyTopics ?? [],
  }
}

function toTaskView(task, fallbackStatus) {
  return {
    ...task,
    id: task.id ?? task.taskId ?? task.candidateId,
    subject: task.subject || task.category || '학습 태스크',
    status: task.status === 'FINISHED' ? 'COMPLETED' : (task.status ?? fallbackStatus),
    schedules: (task.scheduleItems ?? []).map(item => ({
      scheduleId: item.scheduleId,
      scheduleItemId: item.scheduleItemId,
      date: item.date,
      startTime: item.startTime?.slice(0, 5) ?? '시간 미정',
      endTime: item.endTime?.slice(0, 5) ?? null,
      status: item.status,
    })),
  }
}

function totalAvailabilityMinutes(availabilities) {
  return availabilities.reduce((total, availability) => {
    if (availability.enabled === false) return total
    const [startHour, startMinute] = String(availability.startTime ?? '').slice(0, 5).split(':').map(Number)
    const [endHour, endMinute] = String(availability.endTime ?? '').slice(0, 5).split(':').map(Number)
    const start = startHour * 60 + startMinute
    const end = endHour * 60 + endMinute
    return Number.isFinite(start) && Number.isFinite(end) && end > start ? total + end - start : total
  }, 0)
}

export default function LearningManagementPage() {
  const initialMonth = useMemo(() => {
    const today = new Date()
    return { year: today.getFullYear(), month: today.getMonth() }
  }, [])
  const [currentMonth, setCurrentMonth] = useState(initialMonth)
  const [goals, setGoals] = useState([])
  const [selectedGoalId, setSelectedGoalId] = useState(null)
  const [tasks, setTasks] = useState([])
  const [taskListMode, setTaskListMode] = useState('confirmed')
  const [schedule, setSchedule] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false)
  const [isConfirmingTasks, setIsConfirmingTasks] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState(null)
  const [taskGenerationMessage, setTaskGenerationMessage] = useState('')
  const selectedGoal = goals.find(goal => goal.id === selectedGoalId) ?? null

  const loadGoalData = useCallback(async goalId => {
    if (!goalId) { setTasks([]); setTaskListMode('confirmed'); setSchedule(null); return }
    const [candidateTasks, schedules, availabilities, editableAvailabilityDays] = await Promise.all([
      learningManagementApi.getCandidateTasks(goalId),
      learningManagementApi.getSchedules(goalId),
      learningManagementApi.getAvailabilities(goalId),
      learningManagementApi.getEditableAvailabilityDays(goalId),
    ])
    if (candidateTasks?.length) {
      setTaskListMode('candidate')
      setTasks(candidateTasks.map(task => toTaskView(task, 'DRAFT')))
    } else {
      const confirmedTasks = await learningManagementApi.getConfirmedTasks(goalId)
      setTaskListMode('confirmed')
      setTasks((confirmedTasks ?? []).map(task => toTaskView(task, 'CONFIRMED')))
    }
    setGoals(current => current.map(goal => goal.id === goalId ? {
      ...goal,
      availabilities: availabilities ?? [],
      editableAvailabilityDays: editableAvailabilityDays?.days ?? [],
    } : goal))
    const latestSchedule = schedules?.[0]
    setSchedule(latestSchedule ? await learningManagementApi.getSchedule(latestSchedule.scheduleId) : null)
  }, [])

  const refreshGoals = useCallback(async preferredGoalId => {
    setIsLoading(true)
    setError('')
    try {
      const loadedGoals = (await learningManagementApi.getGoals()).map(toGoalView)
      setGoals(loadedGoals)
      const nextGoal = loadedGoals.find(goal => goal.id === preferredGoalId) ?? loadedGoals[0] ?? null
      setSelectedGoalId(nextGoal?.id ?? null)
      await loadGoalData(nextGoal?.id)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [loadGoalData])

  useEffect(() => { refreshGoals() }, [refreshGoals])

  async function selectGoal(goalId) {
    setSelectedGoalId(goalId)
    setError('')
    try { await loadGoalData(goalId) } catch (requestError) { setError(requestError.message) }
  }

  async function saveGoal(form) {
    const saved = modal === 'edit'
      ? await learningManagementApi.updateGoal(selectedGoal.id, form)
      : await learningManagementApi.createGoal(form)
    setModal(null)
    await refreshGoals(saved.id)
  }

  async function saveAvailabilities(availabilities) {
    await learningManagementApi.replaceAvailabilities(selectedGoal.id, { availabilities })
    setGoals(current => current.map(goal => goal.id === selectedGoal.id ? { ...goal, availabilities } : goal))
  }

  async function createReplan({ targetDate, availabilities }) {
    // A confirmed goal cannot be changed through the normal goal PATCH endpoint.
    // Creating a replan proposal must therefore go directly through the replan API.
    const summary = await learningManagementApi.createReplan(selectedGoal.id, { targetDate, availabilities })
    const [candidates, capacity] = await Promise.all([
      learningManagementApi.getReplanCandidates(selectedGoal.id),
      learningManagementApi.getReplanCapacity(selectedGoal.id),
    ])
    return { summary, candidates, capacity }
  }

  async function cancelReplan() {
    await learningManagementApi.cancelReplan(selectedGoal.id)
    setModal(null)
  }

  const createReplanCandidate = payload => learningManagementApi.createReplanCandidate(selectedGoal.id, payload)
  const updateReplanCandidate = (candidateId, payload) => learningManagementApi.updateReplanCandidate(selectedGoal.id, candidateId, payload)
  const deleteReplanCandidate = candidateId => learningManagementApi.deleteReplanCandidate(selectedGoal.id, candidateId)
  const getReplanCapacity = () => learningManagementApi.getReplanCapacity(selectedGoal.id)

  async function confirmReplan() {
    const generatedSchedule = await learningManagementApi.confirmReplan(selectedGoal.id)
    await refreshGoals(selectedGoal.id)
    setSchedule(generatedSchedule)
    setTaskGenerationMessage('재계획안을 확정하고 새 일정을 생성했습니다.')
    setModal(null)
  }

  async function generateTasks() {
    if (!selectedGoal || isGeneratingTasks) return
    setIsGeneratingTasks(true)
    setTaskGenerationMessage('')
    try {
      const candidates = await learningManagementApi.generateTasks(selectedGoal.id)
      setTaskListMode('candidate')
      setTasks((candidates ?? []).map(task => toTaskView(task, 'DRAFT')))
      setTaskGenerationMessage(`AI 태스크 제안 ${candidates?.length ?? 0}개를 생성했습니다. 내용을 검토한 뒤 확정하세요.`)
    } catch (requestError) {
      setTaskGenerationMessage(requestError.message)
    } finally {
      setIsGeneratingTasks(false)
    }
  }

  async function confirmTasks() {
    if (!selectedGoal || isConfirmingTasks) return
    setIsConfirmingTasks(true)
    setTaskGenerationMessage('')
    try {
      await learningManagementApi.confirmTasks(selectedGoal.id)
      const confirmedTasks = await learningManagementApi.getConfirmedTasks(selectedGoal.id)
      setTaskListMode('confirmed')
      setTasks((confirmedTasks ?? []).map(task => toTaskView(task, 'CONFIRMED')))
      setTaskGenerationMessage('태스크를 확정했습니다.')
    } catch (requestError) {
      setTaskGenerationMessage(requestError.message)
    } finally {
      setIsConfirmingTasks(false)
    }
  }

  async function createCandidateTask(payload) {
    if (!selectedGoal) return
    const createdTask = await learningManagementApi.createCandidateTask(selectedGoal.id, payload)
    setTaskListMode('candidate')
    setTasks(current => [...current, toTaskView(createdTask, 'DRAFT')])
  }

  async function updateCandidateTask(taskId, payload) {
    const updatedTask = await learningManagementApi.updateCandidateTask(taskId, payload)
    setTasks(current => current.map(task => task.id === taskId ? toTaskView(updatedTask, 'DRAFT') : task))
  }

  async function deleteCandidateTask(taskId) {
    await learningManagementApi.deleteCandidateTask(taskId)
    setTasks(current => current.filter(task => task.id !== taskId))
  }

  async function deleteConfirmedTask(taskId) {
    await learningManagementApi.deleteConfirmedTask(taskId)
    setTasks(current => current.filter(task => task.id !== taskId))
  }

  async function updateConfirmedTaskCompletion(task, shouldComplete) {
    if (!selectedGoal || updatingTaskId || !task.schedules.length) return
    setUpdatingTaskId(task.id)
    setTaskGenerationMessage('')
    try {
      await Promise.all(task.schedules.map(schedule => shouldComplete
        ? learningManagementApi.completeScheduleItem(schedule.scheduleId, schedule.scheduleItemId)
        : learningManagementApi.revertScheduleItemCompletion(schedule.scheduleId, schedule.scheduleItemId)))
      const confirmedTasks = await learningManagementApi.getConfirmedTasks(selectedGoal.id)
      setTasks(confirmedTasks.map(taskItem => toTaskView(taskItem, 'CONFIRMED')))
    } catch (requestError) {
      setTaskGenerationMessage(requestError.message)
      throw requestError
    } finally {
      setUpdatingTaskId(null)
    }
  }

  return <div className="learning-management-page">
    <header className="learning-management-header"><div><p className="learning-management-kicker">LEARNING MANAGEMENT</p><h1>학습 관리</h1><p>목표, 태스크, 일정을 한 화면에서 관리하세요.</p></div><button type="button" className="draft-badge refresh-button" onClick={() => refreshGoals(selectedGoalId)}><RefreshCw size={13} />새로고침</button></header>
    {isLoading && <section className="learning-management-state">학습 관리 정보를 불러오는 중입니다.</section>}
    {!isLoading && error && <section className="learning-management-state error"><p>{error}</p><button type="button" onClick={() => refreshGoals(selectedGoalId)}>다시 시도</button></section>}
    {!isLoading && !error && !selectedGoal && <section className="learning-management-state"><p>등록된 학습 목표가 없습니다.</p><button type="button" className="primary-action" onClick={() => setModal('create')}><Plus size={15} />새 목표 만들기</button></section>}
    {!isLoading && !error && selectedGoal && <>
      <GoalManagementCard goal={selectedGoal} goals={goals} onSelectGoal={selectGoal} onEdit={() => setModal('edit')} onReplan={() => setModal('replan')} onCreate={() => setModal('create')} />
      <AvailabilityTimeline goalId={selectedGoal.id} availabilities={selectedGoal.availabilities ?? []} editableDays={selectedGoal.editableAvailabilityDays ?? []} onSave={saveAvailabilities} />
      <div className="learning-management-workspace"><TaskList tasks={tasks} mode={taskListMode} availabilityMinutes={totalAvailabilityMinutes(selectedGoal.availabilities ?? [])} onGenerateTasks={generateTasks} onConfirmTasks={confirmTasks} onCreateCandidate={createCandidateTask} onUpdateCandidate={updateCandidateTask} onDeleteCandidate={deleteCandidateTask} onDeleteConfirmed={deleteConfirmedTask} onUpdateConfirmedTaskCompletion={updateConfirmedTaskCompletion} updatingTaskId={updatingTaskId} isGenerating={isGeneratingTasks} isConfirming={isConfirmingTasks} isTaskGenerationComplete={taskListMode === 'confirmed' && tasks.length > 0} generationMessage={taskGenerationMessage} /><MonthlyScheduleCalendar tasks={tasks} schedule={schedule} currentMonth={currentMonth} onMonthChange={setCurrentMonth} /></div>
    </>}
    {modal === 'create' && <GoalFormModal mode="create" onClose={() => setModal(null)} onSave={saveGoal} />}
    {modal === 'edit' && selectedGoal && <GoalFormModal mode="edit" goal={selectedGoal} onClose={() => setModal(null)} onSave={saveGoal} />}
    {modal === 'replan' && selectedGoal && <ReplanModal goal={selectedGoal} availabilities={selectedGoal.availabilities ?? []} onClose={() => setModal(null)} onCreateProposal={createReplan} onCancelProposal={cancelReplan} onCreateCandidate={createReplanCandidate} onUpdateCandidate={updateReplanCandidate} onDeleteCandidate={deleteReplanCandidate} onGetCapacity={getReplanCapacity} onConfirmProposal={confirmReplan} />}
  </div>
}
