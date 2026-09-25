import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import GoalManagementCard from '../components/GoalManagementCard.jsx'
import GoalFormModal from '../components/GoalFormModal.jsx'
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

function toTaskView(task) {
  return {
    ...task,
    subject: task.subject || task.category || '학습 태스크',
    status: task.status === 'FINISHED' ? 'COMPLETED' : task.status,
    schedules: (task.scheduleItems ?? []).map(item => ({
      date: item.date,
      time: item.startTime?.slice(0, 5) ?? '시간 미정',
    })),
  }
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
  const [schedule, setSchedule] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const selectedGoal = goals.find(goal => goal.id === selectedGoalId) ?? null

  const loadGoalData = useCallback(async goalId => {
    if (!goalId) { setTasks([]); setSchedule(null); return }
    const [confirmedTasks, schedules] = await Promise.all([
      learningManagementApi.getConfirmedTasks(goalId),
      learningManagementApi.getSchedules(goalId),
    ])
    setTasks((confirmedTasks ?? []).map(toTaskView))
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

  async function createReplan(payload) {
    await learningManagementApi.createReplan(selectedGoal.id, payload)
    setModal(null)
  }

  return <div className="learning-management-page">
    <header className="learning-management-header"><div><p className="learning-management-kicker">LEARNING MANAGEMENT</p><h1>학습 관리</h1><p>목표, 태스크, 일정을 한 화면에서 관리하세요.</p></div><button type="button" className="draft-badge refresh-button" onClick={() => refreshGoals(selectedGoalId)}><RefreshCw size={13} />새로고침</button></header>
    {isLoading && <section className="learning-management-state">학습 관리 정보를 불러오는 중입니다.</section>}
    {!isLoading && error && <section className="learning-management-state error"><p>{error}</p><button type="button" onClick={() => refreshGoals(selectedGoalId)}>다시 시도</button></section>}
    {!isLoading && !error && !selectedGoal && <section className="learning-management-state"><p>등록된 학습 목표가 없습니다.</p><button type="button" className="primary-action" onClick={() => setModal('create')}><Plus size={15} />새 목표 만들기</button></section>}
    {!isLoading && !error && selectedGoal && <>
      <GoalManagementCard goal={selectedGoal} goals={goals} onSelectGoal={selectGoal} onEdit={() => setModal('edit')} onReplan={() => setModal('replan')} onCreate={() => setModal('create')} />
      <div className="learning-management-workspace"><TaskList tasks={tasks} /><MonthlyScheduleCalendar tasks={tasks} schedule={schedule} currentMonth={currentMonth} onMonthChange={setCurrentMonth} /></div>
    </>}
    {modal === 'create' && <GoalFormModal mode="create" onClose={() => setModal(null)} onSave={saveGoal} />}
    {modal === 'edit' && selectedGoal && <GoalFormModal mode="edit" goal={selectedGoal} onClose={() => setModal(null)} onSave={saveGoal} />}
    {modal === 'replan' && selectedGoal && <ReplanModal goal={selectedGoal} onClose={() => setModal(null)} onSave={createReplan} />}
  </div>
}
