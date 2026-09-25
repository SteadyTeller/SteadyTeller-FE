import { useMemo, useState } from 'react'
import GoalManagementCard from '../components/GoalManagementCard.jsx'
import MonthlyScheduleCalendar from '../components/MonthlyScheduleCalendar.jsx'
import TaskList from '../components/TaskList.jsx'
import '../learning-management.css'

function dateKey({ year, month }, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatDate(date) {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

function createDraftGoals(initialMonth) {
  const startDate = new Date(initialMonth.year, initialMonth.month, 1)
  const nextMonthEnd = new Date(initialMonth.year, initialMonth.month + 2, 0)
  const laterMonthEnd = new Date(initialMonth.year, initialMonth.month + 3, 0)

  return [
    { id: 'goal-engineer', title: '정보처리기사 합격하기', description: '데이터베이스와 알고리즘을 중심으로 자격증 시험을 준비합니다.', startDate: formatDate(startDate), targetDate: formatDate(nextMonthEnd), studyFrequency: '주 4회 · 회당 1시간' },
    { id: 'goal-sql', title: 'SQL 실력 다지기', description: '실무 SQL 문법과 문제 해결 능력을 체계적으로 높입니다.', startDate: formatDate(startDate), targetDate: formatDate(laterMonthEnd), studyFrequency: '주 3회 · 회당 50분' },
    { id: 'goal-english', title: '비즈니스 영어 회화', description: '회의와 이메일에 필요한 영어 표현을 꾸준히 학습합니다.', startDate: formatDate(startDate), targetDate: formatDate(laterMonthEnd), studyFrequency: '주 5회 · 회당 30분' },
  ]
}

function createDraftTasks(initialMonth) {
  return [
    { id: 'task-1', title: '데이터베이스 정규화 개념 정리', subject: '데이터베이스', allocatedMinutes: 45, status: 'COMPLETED', schedules: [{ date: dateKey(initialMonth, 3), time: '19:00' }] },
    { id: 'task-2', title: 'SQL 기출문제 풀이', subject: '문제 풀이', allocatedMinutes: 60, status: 'CONFIRMED', schedules: [{ date: dateKey(initialMonth, 8), time: '20:00' }, { date: dateKey(initialMonth, 15), time: '19:30' }] },
    { id: 'task-3', title: '운영체제 프로세스 복습', subject: '운영체제', allocatedMinutes: 40, status: 'CONFIRMED', schedules: [{ date: dateKey(initialMonth, 12), time: '19:00' }] },
    { id: 'task-4', title: '데이터베이스 모의고사', subject: '실전 점검', allocatedMinutes: 90, status: 'CONFIRMED', schedules: [{ date: dateKey(initialMonth, 22), time: '10:00' }] },
    { id: 'task-5', title: '알고리즘 핵심 개념 복습', subject: '알고리즘', allocatedMinutes: 50, status: 'DRAFT', schedules: [] },
  ]
}

export default function LearningManagementPage() {
  const initialMonth = useMemo(() => {
    const today = new Date()
    return { year: today.getFullYear(), month: today.getMonth() }
  }, [])
  const [currentMonth, setCurrentMonth] = useState(initialMonth)
  const draftTasks = useMemo(() => createDraftTasks(initialMonth), [initialMonth])
  const draftGoals = useMemo(() => createDraftGoals(initialMonth), [initialMonth])
  const [selectedGoalId, setSelectedGoalId] = useState(draftGoals[0].id)
  const selectedGoal = draftGoals.find(goal => goal.id === selectedGoalId) ?? draftGoals[0]

  return <div className="learning-management-page">
    <header className="learning-management-header">
      <div>
        <p className="learning-management-kicker">LEARNING MANAGEMENT</p>
        <h1>학습 관리</h1>
        <p>목표, 태스크, 일정을 한 화면에서 관리하세요.</p>
      </div>
      <span className="draft-badge">초안 · API 연결 전</span>
    </header>

    <GoalManagementCard goal={selectedGoal} goals={draftGoals} onSelectGoal={setSelectedGoalId} />
    <div className="learning-management-workspace">
      <TaskList tasks={draftTasks} />
      <MonthlyScheduleCalendar tasks={draftTasks} currentMonth={currentMonth} onMonthChange={setCurrentMonth} />
    </div>
  </div>
}
