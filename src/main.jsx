import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowRight, Bell, BookOpen, CalendarDays, Check, ChevronDown, CircleHelp,
  Clock3, Flame, LayoutDashboard, Menu, MoreHorizontal, Plus, Search,
  Settings, Sparkles, Target, UserRound, X, Zap
} from 'lucide-react'
import './styles.css'
import './pages.css'
import './auth.css'
import './connection.css'
import { api } from './api'

const tasksSeed = [
  { id: 1, title: '관계형 데이터베이스 기초', category: '데이터베이스', subject: '정규화', minutes: 45, importance: 5, status: 'IN_PROGRESS', source: 'AI_GENERATED' },
  { id: 2, title: 'SQL JOIN 문법 정리하기', category: '데이터베이스', subject: 'SQL', minutes: 35, importance: 4, status: 'PENDING', source: 'AI_GENERATED' },
  { id: 3, title: '인덱스와 쿼리 최적화', category: '데이터베이스', subject: '성능 최적화', minutes: 50, importance: 4, status: 'PENDING', source: 'AI_GENERATED' },
  { id: 4, title: '트랜잭션과 동시성 제어', category: '데이터베이스', subject: '트랜잭션', minutes: 40, importance: 3, status: 'FINISHED', source: 'AI_GENERATED' },
]

const week = [
  { day: '월', date: '08', label: '오늘', items: [{ title: '관계형 데이터베이스 기초', time: '09:00', minutes: 45, state: 'doing' }, { title: 'SQL JOIN 문법 정리하기', time: '20:00', minutes: 35, state: 'next' }] },
  { day: '화', date: '09', items: [{ title: '복습 · 관계형 데이터베이스', time: '20:00', minutes: 25, state: 'review' }] },
  { day: '수', date: '10', items: [{ title: '인덱스와 쿼리 최적화', time: '19:30', minutes: 50, state: 'next' }] },
  { day: '목', date: '11', items: [] },
  { day: '금', date: '12', items: [{ title: '트랜잭션과 동시성 제어', time: '20:00', minutes: 40, state: 'next' }] },
  { day: '토', date: '13', items: [] },
  { day: '일', date: '14', items: [] },
]

function PageIntro({ eyebrow, title, description, action, onAction }) {
  return <div className="page-intro"><div><div className="eyebrow"><span className="eyebrow-dot" /> {eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action && <button className="primary-button" onClick={onAction}><Plus size={17} /> {action}</button>}</div>
}

function GoalPage({ onCreate, showToast, goal, onUpdate, onDelete }) {
  const availability = ['월', '화', '수', '목', '금', '토', '일']
  const activeGoal = goal ?? { title: '학습 목표가 없습니다.', currentLevel: '-', focusArea: '-', dailyStudyHours: 0, availableDays: [] }
  return <>
    <PageIntro eyebrow="MY GOALS" title="학습 목표" description="지금의 목표를 선명하게 바라보고, 꾸준한 계획으로 완성해보세요." action="새 목표 만들기" onAction={onCreate} />
    <div className="goal-layout"><section className="goal-main-card"><div className="goal-main-top"><div><span className="card-kicker">ACTIVE GOAL · {activeGoal.id ?? '-'}</span><h2>{activeGoal.title}</h2><p>{activeGoal.focusArea}를 중심으로 핵심 과목을 완주해요.</p></div><span className="goal-status">진행 중</span></div><div className="goal-big-progress"><div><span>목표 진행률</span><strong>25%</strong></div><div className="progress-track light"><span style={{ width: '25%' }} /></div></div><div className="goal-stats"><div><strong>{activeGoal.targetDate ? `D-${Math.max(0, Math.ceil((new Date(activeGoal.targetDate) - new Date()) / 86400000))}` : '-'}</strong><span>남은 기간</span></div><div><strong>{activeGoal.dailyStudyHours}시간</strong><span>하루 학습</span></div><div><strong>{activeGoal.availableDays?.join(' · ') || '-'}</strong><span>학습 요일</span></div></div><div className="goal-action-row"><button className="outline-button" onClick={onUpdate}>목표 동기화 <ArrowRight size={14} /></button><button className="danger-button" onClick={onDelete}>목표 삭제</button></div></section><section className="goal-side-card"><div className="mini-heading"><span>LEARNING PROFILE</span><Settings size={16} /></div><h3>나의 학습 프로필</h3><div className="profile-row"><span>현재 수준</span><strong>{activeGoal.currentLevel}</strong></div><div className="profile-row"><span>집중 분야</span><strong>{activeGoal.focusArea}</strong></div><div className="profile-row"><span>시작일</span><strong>{activeGoal.startDate ?? '-'}</strong></div><button className="text-button purple" onClick={() => showToast('학습 프로필 편집 화면을 준비 중이에요.')}>프로필 수정하기 <ArrowRight size={15} /></button></section></div>
    <section className="goal-settings-card"><div className="section-head compact"><div><h2>가용 시간</h2><p>AI가 일정을 배치할 때 참고하는 나의 학습 가능 시간이에요.</p></div><button className="outline-button" onClick={() => showToast('가용 시간 수정 화면을 준비 중이에요.')}>수정하기</button></div><div className="availability-row">{availability.map((day, i) => <div className={i === 1 || i === 3 || i === 5 ? 'availability active' : 'availability'} key={day}><span>{day}</span><strong>{i === 1 || i === 3 || i === 5 ? '20:00' : '—'}</strong>{i === 1 || i === 3 || i === 5 ? <small>~ 21:00</small> : <small>쉬는 날</small>}</div>)}</div></section>
  </>
}

function SchedulePage({ showToast, week: propsWeek = week, onGenerateSchedule, onDeleteSchedule }) {
  return <><PageIntro eyebrow="MY SCHEDULE" title="내 일정" description="나에게 맞춰 배치된 학습 계획을 한눈에 확인해보세요." action="일정 다시 만들기" onAction={onGenerateSchedule} /><section className="schedule-page-card"><div className="schedule-page-toolbar"><button className="month-button">‹</button><strong>내 학습 스케줄</strong><button className="month-button">›</button><div className="schedule-tabs"><button className="active">주간</button><button onClick={() => showToast('월간 보기로 전환했어요.')}>월간</button><button className="danger-button" onClick={onDeleteSchedule}>일정 삭제</button></div></div><div className="full-calendar-grid">{propsWeek.map((day, index) => <div className={index === 0 ? 'full-day today' : 'full-day'} key={day.date}><div className="full-date"><span>{day.day}</span><strong>{day.date}</strong>{index === 0 && <i>오늘</i>}</div>{day.items.length ? day.items.map((item, i) => <div className={`full-schedule-item ${item.state}`} key={i}><span>{item.time}</span><strong>{item.title}</strong><small><Clock3 size={12} /> {item.minutes}분 학습</small></div>) : <div className="free-space"><Plus size={16} /><span>비어 있음</span></div>}</div>)}</div></section><div className="schedule-bottom-grid"><section className="insight-card"><div className="mini-heading"><span>THIS WEEK</span><Flame size={17} /></div><h3>이번 주 3시간 15분</h3><p>지난주보다 <b>45분 더</b> 계획했어요.</p><div className="mini-bars">{[40, 58, 32, 74, 48, 22, 10].map((height, i) => <i key={i} style={{ height: `${height}%` }} className={i < 3 ? 'on' : ''} />)}</div></section><section className="insight-card next-card"><div><span className="card-kicker">NEXT UP</span><h3>다음 학습을 시작해볼까요?</h3><p><Clock3 size={13} /> 오늘 배정된 태스크를 확인해보세요.</p></div><div className="next-arrow"><ArrowRight size={18} /></div></section></div></>
}

function TaskPage({ tasks, toggleTask, statusLabel, showToast, onConfirm, onAdd, onDelete, onCreate }) {
  return <><PageIntro eyebrow="LEARNING TASKS" title="학습 태스크" description="AI가 제안한 학습 태스크를 검토하고, 나만의 학습 목록을 완성해보세요." action="AI 태스크 다시 생성" onAction={onCreate} /><div className="task-summary-row"><div className="task-summary"><div className="summary-icon purple"><BookOpen size={18} /></div><div><strong>{tasks.length}</strong><span>전체 태스크</span></div></div><div className="task-summary"><div className="summary-icon orange"><Clock3 size={18} /></div><div><strong>{tasks.reduce((sum, task) => sum + (task.minutes ?? 0), 0)}분</strong><span>예상 학습 시간</span></div></div><div className="task-summary"><div className="summary-icon mint"><Check size={18} /></div><div><strong>{tasks.filter(task => task.status === 'FINISHED').length}</strong><span>완료한 태스크</span></div></div><div className="task-summary ai-summary"><Sparkles size={18} /><div><strong>AI 추천 태스크</strong><span>목표에 맞춰 자동으로 생성됨</span></div></div></div><section className="full-task-card"><div className="task-filter-row"><div><button className="filter active">전체 <b>{tasks.length}</b></button><button className="filter">예정</button><button className="filter">진행 중</button><button className="filter">완료</button></div><div className="task-filter-actions"><button className="outline-button" onClick={() => showToast('필터 옵션을 준비 중이에요.')}><ChevronDown size={14} /> 정렬: 중요도순</button><button className="primary-button" onClick={onConfirm}><Check size={15} /> 태스크 확정</button></div></div>{tasks.map(task => <div className="large-task-row" key={task.id}><button className={task.status === 'FINISHED' ? 'check-box checked' : 'check-box'} onClick={() => toggleTask(task.id)}>{task.status === 'FINISHED' && <Check size={14} />}</button><div className="large-task-content"><div><strong>{task.title}</strong><span>{task.subject} · {task.source === 'AI_GENERATED' ? '✦ AI가 제안한 태스크' : '직접 추가한 태스크'}</span></div><div className="large-task-meta"><span className="category-pill">{task.category}</span><span><Clock3 size={13} /> {task.minutes}분</span><span className="importance">{Array.from({ length: 5 }, (_, i) => <i className={i < task.importance ? 'filled' : ''} key={i}>★</i>)}</span><span className={`status ${task.status.toLowerCase()}`}>{statusLabel[task.status]}</span></div></div><button className="more-button" onClick={() => onDelete(task.id)}><MoreHorizontal size={19} /></button></div>)}<button className="add-task big-add" onClick={onAdd}><Plus size={16} /> 직접 태스크 추가하기</button></section></>
}

function WorkspacePage({ activeNav, ...props }) {
  if (activeNav === '학습 목표') return <GoalPage {...props} />
  if (activeNav === '내 일정') return <SchedulePage {...props} />
  return <TaskPage {...props} />
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        await api.signup(email, password, nickname)
        setMode('login')
        setPassword('')
        setNotice('회원가입이 완료되었습니다. 로그인해주세요.')
      } else {
        const result = await api.login(email, password)
        localStorage.setItem('steadyTeller.accessToken', result.accessToken)
        onLogin(result.member)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const isSignup = mode === 'signup'
  return <div className="auth-screen"><div className="auth-glow" /><div className="auth-card"><div className="brand auth-brand"><span className="brand-mark"><Sparkles size={17} fill="currentColor" /></span><span>Steady<span className="brand-accent">Teller</span></span></div><span className="card-kicker auth-kicker">YOUR STEADY LEARNING COACH</span><h1>{isSignup ? <>나만의 학습을<br /><em>시작해볼까요?</em></> : <>다시, 꾸준히<br /><em>시작해볼까요?</em></>}</h1><p>{isSignup ? <>계정을 만들고 나에게 맞는<br />학습 목표와 일정을 준비해보세요.</> : <>로그인하면 나만의 학습 목표와<br />AI가 만든 일정을 이어갈 수 있어요.</>}</p><form onSubmit={submit}>{isSignup && <label>닉네임<input required value={nickname} onChange={e => setNickname(e.target.value)} placeholder="하늘" /></label>}<label>이메일<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label><label>비밀번호<input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="8자 이상 입력해주세요" /></label>{error && <div className="auth-error">{error}</div>}{notice && <div className="auth-notice">{notice}</div>}<button className="primary-button full" disabled={loading}>{loading ? (isSignup ? '가입 중...' : '로그인 중...') : (isSignup ? '회원가입하기' : '로그인하기')} <ArrowRight size={16} /></button></form><button className="auth-switch" onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError(''); setNotice('') }}>{isSignup ? '이미 계정이 있나요? 로그인' : '처음 오셨나요? 회원가입'}</button></div><div className="auth-quote"><Sparkles size={17} /> “작은 계획이 쌓여, 결국 나만의 실력이 됩니다.”</div></div>
}

function mapCandidate(candidate) {
  return { id: candidate.candidateId, title: candidate.title, category: candidate.category, subject: candidate.subject, minutes: candidate.allocatedMinutes, importance: candidate.importance ?? candidate.difficulty ?? 3, difficulty: candidate.difficulty, status: 'PENDING', source: candidate.source, isModified: candidate.isModified }
}

function makeWeekFromSchedule(schedule) {
  if (!schedule?.dailySchedules?.length) return week
  const dayNames = { MONDAY: '월', TUESDAY: '화', WEDNESDAY: '수', THURSDAY: '목', FRIDAY: '금', SATURDAY: '토', SUNDAY: '일' }
  const byDate = new Map(schedule.dailySchedules.map(day => [String(day.date), day]))
  const start = new Date(`${schedule.scheduleStartDate}T00:00:00`)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const iso = date.toISOString().slice(0, 10)
    const day = byDate.get(iso)
    return { day: dayNames[day?.dayOfWeek] ?? ['일', '월', '화', '수', '목', '금', '토'][date.getDay()], date: String(date.getDate()).padStart(2, '0'), items: (day?.items ?? []).map(item => ({ title: item.title, time: '', minutes: item.allocatedMinutes, state: item.status === 'FINISHED' ? 'review' : 'next', scheduleItemId: item.scheduleItemId })) }
  })
}

function SettingsPanel({ member, onClose, onLogout, showToast }) {
  const [nickname, setNickname] = useState(member?.nickname ?? '')
  const [profile, setProfile] = useState({ defaultLevel: 'BEGINNER', preferredStartTime: '20:00', notificationEnabled: true })
  const [availability, setAvailability] = useState([])
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    Promise.all([api.learningProfile(), api.availabilities()]).then(([loadedProfile, loadedAvailability]) => { if (loadedProfile) setProfile({ defaultLevel: loadedProfile.defaultLevel, preferredStartTime: loadedProfile.preferredStartTime?.slice(0, 5) ?? '', notificationEnabled: loadedProfile.notificationEnabled }); setAvailability(loadedAvailability ?? []) }).catch(error => showToast(error.message))
  }, [showToast])
  const save = async () => {
    setSaving(true)
    try { await api.updateMember({ nickname }); await api.updateLearningProfile(profile); showToast('계정 설정이 저장되었어요.'); onClose() } catch (error) { showToast(error.message) } finally { setSaving(false) }
  }
  return <div className="modal-backdrop" onClick={onClose}><div className="settings-modal" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={onClose}><X size={18} /></button><span className="card-kicker">ACCOUNT SETTINGS</span><h2>계정 및 학습 설정</h2><label>닉네임<input value={nickname} onChange={event => setNickname(event.target.value)} /></label><div className="settings-grid"><label>기본 학습 수준<select value={profile.defaultLevel} onChange={event => setProfile({ ...profile, defaultLevel: event.target.value })}><option value="BEGINNER">초급</option><option value="INTERMEDIATE">중급</option><option value="ADVANCED">고급</option></select></label><label>선호 시작 시간<input type="time" value={profile.preferredStartTime} onChange={event => setProfile({ ...profile, preferredStartTime: event.target.value })} /></label></div><label className="toggle-label"><input type="checkbox" checked={profile.notificationEnabled} onChange={event => setProfile({ ...profile, notificationEnabled: event.target.checked })} /> 학습 알림 받기</label><div className="settings-availability"><div className="mini-heading"><span>REGISTERED AVAILABILITIES</span><span>{availability.length}개</span></div>{availability.length ? availability.map(item => <div className="availability-line" key={item.id}><span>{item.dayOfWeek}</span><strong>{item.startTime?.slice(0, 5)}–{item.endTime?.slice(0, 5)}</strong><button onClick={async () => { try { await api.deleteAvailability(item.id); setAvailability(current => current.filter(row => row.id !== item.id)); showToast('가용 시간이 삭제되었어요.') } catch (error) { showToast(error.message) } }}><X size={14} /></button></div>) : <p className="empty-settings">등록된 가용 시간이 없습니다.</p>}</div><div className="settings-actions"><button className="danger-button" onClick={onLogout}>회원 탈퇴</button><button className="primary-button" onClick={save} disabled={saving}>{saving ? '저장 중...' : '변경 저장'}</button></div></div></div>
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('steadyTeller.accessToken'))
  const [member, setMember] = useState(null)
  const [goals, setGoals] = useState([])
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [currentScheduleId, setCurrentScheduleId] = useState(null)
  const [calendarWeek, setCalendarWeek] = useState(week)
  const [loading, setLoading] = useState(Boolean(token))
  const [loadError, setLoadError] = useState('')
  const [activeNav, setActiveNav] = useState('대시보드')
  const [tasks, setTasks] = useState(tasksSeed)
  const [toast, setToast] = useState('')
  const [isModalOpen, setModalOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const completed = tasks.filter(t => t.status === 'FINISHED').length
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0

  const showToast = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2600) }
  const toggleTask = (id) => setTasks(current => current.map(t => t.id === id ? { ...t, status: t.status === 'FINISHED' ? 'PENDING' : 'FINISHED' } : t))
  const statusLabel = { PENDING: '예정', IN_PROGRESS: '진행 중', FINISHED: '완료' }

  useEffect(() => {
    if (!token) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const [me, goalList] = await Promise.all([api.member(), api.goals()])
        if (cancelled) return
        const goal = goalList?.[0] ?? null
        setMember(me)
        setGoals(goalList ?? [])
        setSelectedGoal(goal)
        if (goal) {
          const [candidateList, scheduleList] = await Promise.all([api.candidates(goal.id), api.schedules(goal.id)])
          if (cancelled) return
          setTasks((candidateList ?? []).map(mapCandidate))
          // ScheduleRepository는 startDate 내림차순으로 반환하므로 첫 번째가 최신 일정이다.
          const latest = scheduleList?.[0]
          if (latest) { setCurrentScheduleId(latest.scheduleId); setCalendarWeek(makeWeekFromSchedule(await api.schedule(latest.scheduleId))) }
        } else { setTasks([]); setCalendarWeek([]); setCurrentScheduleId(null) }
      } catch (error) {
        if (!cancelled) setLoadError(error.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [token])

  const handleLogin = (loggedInMember) => {
    setMember(loggedInMember)
    setToken(localStorage.getItem('steadyTeller.accessToken'))
  }
  const logout = () => {
    localStorage.removeItem('steadyTeller.accessToken')
    setToken(null)
    setMember(null)
    setGoals([])
    setSelectedGoal(null)
  }
  const withdraw = async () => {
    if (!window.confirm('회원 탈퇴를 진행할까요?')) return
    try { await api.withdraw(); logout() } catch (error) { showToast(error.message) }
  }
  const refreshTasks = async () => {
    if (!selectedGoal) return
    const candidateList = await api.candidates(selectedGoal.id)
    setTasks((candidateList ?? []).map(mapCandidate))
  }
  const generateTasks = async () => {
    if (!selectedGoal) return showToast('먼저 학습 목표를 만들어주세요.')
    try {
      const candidateList = await api.generateTasks(selectedGoal.id)
      setTasks((candidateList ?? []).map(mapCandidate))
      showToast('AI가 학습 태스크를 생성했어요.')
    } catch (error) { showToast(error.message) }
  }
  const confirmTasks = async () => {
    if (!selectedGoal) return showToast('먼저 학습 목표를 만들어주세요.')
    try {
      const confirmed = await api.confirmTasks(selectedGoal.id)
      setTasks((confirmed ?? []).map(task => ({ ...mapCandidate({ ...task, candidateId: task.id, allocatedMinutes: task.allocatedMinutes }), status: task.status })))
      showToast('학습 태스크가 확정되었어요.')
    } catch (error) { showToast(error.message) }
  }
  const generateSchedule = async () => {
    if (!selectedGoal) return showToast('먼저 학습 목표를 만들어주세요.')
    try {
      const schedule = await api.generateSchedule(selectedGoal.id)
      setCurrentScheduleId(schedule.scheduleId)
      setCalendarWeek(makeWeekFromSchedule(schedule))
      showToast('새 학습 일정이 생성되었어요.')
    } catch (error) { showToast(error.message) }
  }
  const updateGoal = async () => {
    if (!selectedGoal) return
    try {
      const updated = await api.updateGoal(selectedGoal.id, { title: selectedGoal.title, startDate: selectedGoal.startDate, targetDate: selectedGoal.targetDate, currentLevel: selectedGoal.currentLevel, dailyStudyHours: selectedGoal.dailyStudyHours, availableDays: selectedGoal.availableDays, focusArea: selectedGoal.focusArea })
      setSelectedGoal(updated)
      setGoals(current => current.map(goal => goal.id === updated.id ? updated : goal))
      showToast('학습 목표가 업데이트되었어요.')
    } catch (error) { showToast(error.message) }
  }
  const deleteGoal = async () => {
    if (!selectedGoal || !window.confirm('현재 학습 목표를 삭제할까요?')) return
    try {
      await api.deleteGoal(selectedGoal.id)
      setGoals(current => current.filter(goal => goal.id !== selectedGoal.id))
      setSelectedGoal(null)
      setTasks([])
      setCalendarWeek([])
      showToast('학습 목표가 삭제되었어요.')
    } catch (error) { showToast(error.message) }
  }
  const addCandidate = async () => {
    if (!selectedGoal) return showToast('먼저 학습 목표를 만들어주세요.')
    try {
      await api.addCandidate(selectedGoal.id, { title: '복습 태스크', category: selectedGoal.focusArea || '기타', subject: selectedGoal.focusArea || '기초 개념', difficulty: 3, allocatedMinutes: 30 })
      await refreshTasks()
      showToast('새 태스크가 추가되었어요.')
    } catch (error) { showToast(error.message) }
  }
  const deleteCandidate = async (taskId) => {
    if (!window.confirm('이 후보 태스크를 삭제할까요?')) return
    try { await api.deleteCandidate(taskId); await refreshTasks(); showToast('후보 태스크가 삭제되었어요.') } catch (error) { showToast(error.message) }
  }
  const deleteSchedule = async () => {
    if (!currentScheduleId || !window.confirm('현재 일정을 삭제할까요?')) return
    try { await api.deleteSchedule(currentScheduleId); setCurrentScheduleId(null); setCalendarWeek([]); showToast('일정이 삭제되었어요.') } catch (error) { showToast(error.message) }
  }
  const createGoal = async () => {
    try {
      const today = new Date()
      const target = new Date(today)
      target.setDate(today.getDate() + 42)
      const payload = { title: '정보처리기사 합격하기', startDate: today.toISOString().slice(0, 10), targetDate: target.toISOString().slice(0, 10), currentLevel: 'BEGINNER', dailyStudyHours: 1, availableDays: ['MON', 'WED', 'FRI'], focusArea: '데이터베이스' }
      const goal = await api.createGoal(payload)
      setGoals(current => [...current, goal])
      setSelectedGoal(goal)
      setModalOpen(false)
      showToast('학습 목표가 생성되었어요.')
    } catch (error) { showToast(error.message) }
  }

  if (!token) return <AuthScreen onLogin={handleLogin} />
  if (loading) return <div className="app-loading"><Sparkles size={24} /><strong>SteadyTeller를 준비하고 있어요</strong><span>목표와 학습 계획을 불러오는 중입니다.</span></div>

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Sparkles size={17} fill="currentColor" /></span><span>Steady<span className="brand-accent">Teller</span></span></div>
      <div className="profile-mini"><div className="avatar">{(member?.nickname ?? '김').slice(0, 1)}</div><div><strong>{member?.nickname ?? '김하늘'}</strong><span>{member?.email ?? '꾸준히, 나답게'}</span></div><ChevronDown size={15} /></div>
      <nav>
        <p className="nav-label">WORKSPACE</p>
        {[[LayoutDashboard, '대시보드'], [Target, '학습 목표'], [CalendarDays, '내 일정'], [BookOpen, '학습 태스크']].map(([Icon, label]) => <button key={label} className={activeNav === label ? 'nav-item active' : 'nav-item'} onClick={() => setActiveNav(label)}><Icon size={19} /><span>{label}</span>{label === '학습 태스크' && <span className="nav-count">4</span>}</button>)}
        <p className="nav-label nav-label-later">PERSONAL</p>
        <button className="nav-item" onClick={() => showToast('학습 통계는 다음 업데이트에서 만나요.')}><Zap size={19} /><span>학습 리포트</span><span className="soon">SOON</span></button>
        <button className="nav-item" onClick={() => setSettingsOpen(true)}><Settings size={19} /><span>계정 설정</span></button>
        <button className="nav-item" onClick={logout}><span className="logout-mark">↪</span><span>로그아웃</span></button>
      </nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={18} /></div><strong>Steady하게 시작해요</strong><p>목표를 세우면 AI가<br />나에게 맞는 계획을 짜드려요.</p><button onClick={() => setModalOpen(true)}>목표 설정하기 <ArrowRight size={14} /></button></div><div className="sidebar-foot"><span>© 2026 SteadyTeller</span><span>도움말</span></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><button className="mobile-menu"><Menu size={20} /></button><div className="breadcrumb">Workspace <span>/</span> {activeNav}</div><div className="top-actions"><button className="icon-button"><Search size={19} /></button><button className="icon-button notification"><Bell size={19} /><i /></button><div className="top-avatar">{(member?.nickname ?? '김').slice(0, 1)}</div></div></header>
      <div className="content-wrap">
        {loadError && <div className="connection-error"><CircleHelp size={16} /><span>{loadError}</span><button onClick={() => window.location.reload()}>다시 시도</button></div>}
        {activeNav !== '대시보드' && <WorkspacePage activeNav={activeNav} tasks={tasks} toggleTask={toggleTask} statusLabel={statusLabel} goal={selectedGoal} onCreate={activeNav === '학습 태스크' ? generateTasks : () => setModalOpen(true)} onConfirm={confirmTasks} onGenerateSchedule={generateSchedule} onUpdate={updateGoal} onDelete={activeNav === '학습 목표' ? deleteGoal : deleteCandidate} onAdd={addCandidate} onDeleteCandidate={deleteCandidate} onDeleteSchedule={deleteSchedule} week={calendarWeek} showToast={showToast} />}
        {activeNav === '대시보드' && <>
        <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot" /> MONDAY, SEPTEMBER 8, 2026</div><h1>안녕하세요, 하늘님 <span>👋</span></h1><p>오늘도 작은 한 걸음을 쌓아볼까요?</p></div><button className="primary-button" onClick={() => setModalOpen(true)}><Plus size={18} /> 새 목표 만들기</button></section>
        <section className="hero-grid"><div className="focus-card"><div className="focus-head"><div><span className="card-kicker">CURRENT GOAL</span><h2>정보처리기사<br /><em>합격하기</em></h2></div><div className="goal-icon"><Target size={26} /></div></div><div className="goal-meta"><span><CalendarDays size={15} /> D-42</span><span><Clock3 size={15} /> 하루 1시간</span><span className="goal-tag">진행 중</span></div><div className="hero-progress"><div><span>전체 진행률</span><strong>{progress}%</strong></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><small>4개 중 {completed}개 태스크 완료</small></div><button className="text-button" onClick={() => setActiveNav('학습 목표')}>목표 자세히 보기 <ArrowRight size={16} /></button></div><div className="streak-card"><div className="streak-top"><div><span className="card-kicker">MY RHYTHM</span><h3>이번 주 학습 리듬</h3></div><div className="flame"><Flame size={22} fill="currentColor" /></div></div><div className="streak-number"><strong>3</strong><span>일 연속<br />학습 중</span></div><div className="week-dots">{['월','화','수','목','금','토','일'].map((d, i) => <div key={d} className={i < 3 ? 'day done' : i === 3 ? 'day today' : 'day'}><span>{d}</span><i>{i < 3 ? <Check size={12} /> : ''}</i></div>)}</div><p className="streak-tip"><span>✦</span> 지금 흐름이 좋아요. 오늘도 이어가볼까요?</p></div></section>
        <section className="section-head"><div><h2>이번 주 일정</h2><p>가용 시간을 바탕으로 배치된 학습 계획이에요.</p></div><button className="outline-button" onClick={() => setActiveNav('내 일정')}>전체 일정 보기 <ArrowRight size={15} /></button></section>
        <section className="schedule-card"><div className="schedule-toolbar"><button className="month-button">2026년 9월 <ChevronDown size={15} /></button><div className="legend"><span><i className="legend-dot blue" /> 학습 예정</span><span><i className="legend-dot purple" /> 복습</span></div></div><div className="calendar-grid">{calendarWeek.map((day, index) => <div className={index === 0 ? 'calendar-day selected' : 'calendar-day'} key={day.date}><div className="date-head"><span>{day.day}</span><strong>{day.date}</strong></div><div className="day-items">{day.items.length ? day.items.map((item, i) => <div className={`schedule-item ${item.state}`} key={i}><div className="item-time">{item.time}</div><strong>{item.title}</strong><span><Clock3 size={12} /> {item.minutes}분</span></div>) : <button className="empty-day" onClick={() => showToast(`${day.day}요일에 학습을 추가할 수 있어요.`)}><Plus size={16} /><span>학습 추가</span></button>}</div></div>)}</div></section>
        <section className="section-head tasks-head"><div><h2>학습 태스크 검토</h2><p>AI가 목표에 맞춰 제안한 태스크예요. 확인하고 나만의 계획을 완성해보세요.</p></div><button className="outline-button" onClick={() => setActiveNav('학습 태스크')}>전체 보기 <ArrowRight size={15} /></button></section>
        <section className="task-card"><div className="task-table-head"><span>학습 내용</span><span>분류</span><span>예상 시간</span><span>중요도</span><span>상태</span><span /></div>{tasks.map(task => <div className="task-row" key={task.id}><button className={task.status === 'FINISHED' ? 'check-box checked' : 'check-box'} onClick={() => toggleTask(task.id)}>{task.status === 'FINISHED' && <Check size={14} />}</button><div className={task.status === 'FINISHED' ? 'task-title completed' : 'task-title'}><strong>{task.title}</strong><span>{task.source === 'AI_GENERATED' ? '✦ AI 추천' : '직접 추가'} · {task.subject}</span></div><span className="category-pill">{task.category}</span><span className="minutes"><Clock3 size={14} /> {task.minutes}분</span><span className="importance">{Array.from({ length: 5 }, (_, i) => <i className={i < task.importance ? 'filled' : ''} key={i}>★</i>)}</span><span className={`status ${task.status.toLowerCase()}`}>{statusLabel[task.status]}</span><button className="more-button" onClick={() => showToast('태스크 상세 메뉴를 준비 중이에요.')}><MoreHorizontal size={18} /></button></div>)}<button className="add-task" onClick={() => showToast('새 태스크를 추가할 수 있어요.')}><Plus size={16} /> 직접 태스크 추가하기</button></section>
        <footer className="page-footer"><span><Sparkles size={14} /> 오늘의 꾸준함이 내일의 실력이 돼요.</span><span>마지막 동기화 · 방금 전</span></footer>
        </>}
      </div>
    </main>
    {isModalOpen && <div className="modal-backdrop" onClick={() => setModalOpen(false)}><div className="modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setModalOpen(false)}><X size={18} /></button><div className="modal-symbol"><Target size={24} /></div><span className="card-kicker">NEW GOAL</span><h2>새로운 목표를 시작해요</h2><p>목표와 학습 가능 시간을 알려주면<br />나에게 맞는 계획을 만들어드릴게요.</p><label>학습 목표<input defaultValue="정보처리기사 합격하기" /></label><label>집중 분야<input placeholder="예: 데이터베이스, 운영체제" /></label><button className="primary-button full" onClick={createGoal}>AI 계획 만들기 <Sparkles size={16} /></button></div></div>}
    {settingsOpen && <SettingsPanel member={member} onClose={() => setSettingsOpen(false)} onLogout={withdraw} showToast={showToast} />}
    {toast && <div className="toast"><Check size={16} /> {toast}</div>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
