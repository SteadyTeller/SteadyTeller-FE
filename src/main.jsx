import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowRight, Bell, BookOpen, CalendarDays, Check, ChevronDown, CircleHelp,
  Clock3, Flame, LayoutDashboard, Menu, MoreHorizontal, Plus, Search,
  LogOut, Settings, Sparkles, Target, UserRound, X, Zap
} from 'lucide-react'
import './styles.css'
import './pages.css'
import { clearSession, getMyProfile, loadSession, login, saveSession, signUp } from './api'

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

function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', nickname: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setSubmitting] = useState(false)

  const updateField = (event) => {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'signup') {
        await signUp(form)
        setMode('login')
        setForm(current => ({ ...current, password: '' }))
        return
      }
      const loginResponse = await login({ email: form.email, password: form.password })
      saveSession(loginResponse)
      onAuthenticated({ accessToken: loginResponse.accessToken, member: loginResponse.member })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="auth-page">
    <section className="auth-card">
      <div className="brand auth-brand"><span className="brand-mark"><Sparkles size={17} fill="currentColor" /></span><span>Steady<span className="brand-accent">Teller</span></span></div>
      <span className="card-kicker">WELCOME</span>
      <h1>{mode === 'login' ? '다시 만나서 반가워요' : '꾸준한 학습을 시작해요'}</h1>
      <p>{mode === 'login' ? '로그인하고 오늘의 학습 계획을 확인하세요.' : '계정을 만들고 나만의 학습 계획을 받아보세요.'}</p>
      <div className="auth-tabs">
        <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError('') }}>로그인</button>
        <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError('') }}>회원가입</button>
      </div>
      <form onSubmit={submit}>
        {mode === 'signup' && <label>닉네임<input name="nickname" value={form.nickname} onChange={updateField} maxLength="50" required /></label>}
        <label>이메일<input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" required /></label>
        <label>비밀번호<input name="password" type="password" value={form.password} onChange={updateField} minLength="8" maxLength="64" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="primary-button auth-submit" disabled={isSubmitting}>{isSubmitting ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}</button>
      </form>
    </section>
  </main>
}

function PageIntro({ eyebrow, title, description, action, onAction }) {
  return <div className="page-intro"><div><div className="eyebrow"><span className="eyebrow-dot" /> {eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action && <button className="primary-button" onClick={onAction}><Plus size={17} /> {action}</button>}</div>
}

function GoalPage({ onCreate, showToast }) {
  const availability = ['월', '화', '수', '목', '금', '토', '일']
  return <>
    <PageIntro eyebrow="MY GOALS" title="학습 목표" description="지금의 목표를 선명하게 바라보고, 꾸준한 계획으로 완성해보세요." action="새 목표 만들기" onAction={onCreate} />
    <div className="goal-layout"><section className="goal-main-card"><div className="goal-main-top"><div><span className="card-kicker">ACTIVE GOAL · 01</span><h2>정보처리기사 합격하기</h2><p>데이터베이스를 중심으로 핵심 과목을 완주해요.</p></div><span className="goal-status">진행 중</span></div><div className="goal-big-progress"><div><span>목표 진행률</span><strong>25%</strong></div><div className="progress-track light"><span style={{ width: '25%' }} /></div></div><div className="goal-stats"><div><strong>D-42</strong><span>남은 기간</span></div><div><strong>1시간</strong><span>하루 학습</span></div><div><strong>월·수·금</strong><span>학습 요일</span></div></div><button className="outline-button" onClick={() => showToast('목표 상세 편집 화면을 준비 중이에요.')}>목표 편집하기 <ArrowRight size={14} /></button></section><section className="goal-side-card"><div className="mini-heading"><span>LEARNING PROFILE</span><Settings size={16} /></div><h3>나의 학습 프로필</h3><div className="profile-row"><span>현재 수준</span><strong>초급</strong></div><div className="profile-row"><span>집중 분야</span><strong>데이터베이스</strong></div><div className="profile-row"><span>선호 학습 시간</span><strong>저녁 8시</strong></div><button className="text-button purple" onClick={() => showToast('학습 프로필 편집 화면을 준비 중이에요.')}>프로필 수정하기 <ArrowRight size={15} /></button></section></div>
    <section className="goal-settings-card"><div className="section-head compact"><div><h2>가용 시간</h2><p>AI가 일정을 배치할 때 참고하는 나의 학습 가능 시간이에요.</p></div><button className="outline-button" onClick={() => showToast('가용 시간 수정 화면을 준비 중이에요.')}>수정하기</button></div><div className="availability-row">{availability.map((day, i) => <div className={i === 1 || i === 3 || i === 5 ? 'availability active' : 'availability'} key={day}><span>{day}</span><strong>{i === 1 || i === 3 || i === 5 ? '20:00' : '—'}</strong>{i === 1 || i === 3 || i === 5 ? <small>~ 21:00</small> : <small>쉬는 날</small>}</div>)}</div></section>
  </>
}

function SchedulePage({ showToast }) {
  return <><PageIntro eyebrow="MY SCHEDULE" title="내 일정" description="나에게 맞춰 배치된 학습 계획을 한눈에 확인해보세요." action="일정 다시 만들기" onAction={() => showToast('AI가 새로운 일정을 계산하고 있어요.')} /><section className="schedule-page-card"><div className="schedule-page-toolbar"><button className="month-button">‹</button><strong>2026년 9월 8일 — 14일</strong><button className="month-button">›</button><div className="schedule-tabs"><button className="active">주간</button><button onClick={() => showToast('월간 보기로 전환했어요.')}>월간</button></div></div><div className="full-calendar-grid">{week.map((day, index) => <div className={index === 0 ? 'full-day today' : 'full-day'} key={day.date}><div className="full-date"><span>{day.day}</span><strong>{day.date}</strong>{index === 0 && <i>오늘</i>}</div>{day.items.length ? day.items.map((item, i) => <div className={`full-schedule-item ${item.state}`} key={i}><span>{item.time}</span><strong>{item.title}</strong><small><Clock3 size={12} /> {item.minutes}분 학습</small></div>) : <div className="free-space"><Plus size={16} /><span>비어 있음</span></div>}</div>)}</div></section><div className="schedule-bottom-grid"><section className="insight-card"><div className="mini-heading"><span>THIS WEEK</span><Flame size={17} /></div><h3>이번 주 3시간 15분</h3><p>지난주보다 <b>45분 더</b> 계획했어요.</p><div className="mini-bars">{[40, 58, 32, 74, 48, 22, 10].map((height, i) => <i key={i} style={{ height: `${height}%` }} className={i < 3 ? 'on' : ''} />)}</div></section><section className="insight-card next-card"><div><span className="card-kicker">NEXT UP</span><h3>SQL JOIN 문법 정리하기</h3><p><Clock3 size={13} /> 오늘 오후 8:00 · 35분</p></div><div className="next-arrow"><ArrowRight size={18} /></div></section></div></>
}

function TaskPage({ tasks, toggleTask, statusLabel, showToast }) {
  return <><PageIntro eyebrow="LEARNING TASKS" title="학습 태스크" description="AI가 제안한 학습 태스크를 검토하고, 나만의 학습 목록을 완성해보세요." action="태스크 추가" onAction={() => showToast('새 태스크 입력 창을 준비 중이에요.')} /><div className="task-summary-row"><div className="task-summary"><div className="summary-icon purple"><BookOpen size={18} /></div><div><strong>4</strong><span>전체 태스크</span></div></div><div className="task-summary"><div className="summary-icon orange"><Clock3 size={18} /></div><div><strong>170분</strong><span>예상 학습 시간</span></div></div><div className="task-summary"><div className="summary-icon mint"><Check size={18} /></div><div><strong>1</strong><span>완료한 태스크</span></div></div><div className="task-summary ai-summary"><Sparkles size={18} /><div><strong>AI 추천 태스크</strong><span>목표에 맞춰 자동으로 생성됨</span></div></div></div><section className="full-task-card"><div className="task-filter-row"><div><button className="filter active">전체 <b>4</b></button><button className="filter">예정 <b>2</b></button><button className="filter">진행 중 <b>1</b></button><button className="filter">완료 <b>1</b></button></div><button className="outline-button" onClick={() => showToast('필터 옵션을 준비 중이에요.')}><ChevronDown size={14} /> 정렬: 중요도순</button></div>{tasks.map(task => <div className="large-task-row" key={task.id}><button className={task.status === 'FINISHED' ? 'check-box checked' : 'check-box'} onClick={() => toggleTask(task.id)}>{task.status === 'FINISHED' && <Check size={14} />}</button><div className="large-task-content"><div><strong>{task.title}</strong><span>{task.subject} · {task.source === 'AI_GENERATED' ? '✦ AI가 제안한 태스크' : '직접 추가한 태스크'}</span></div><div className="large-task-meta"><span className="category-pill">{task.category}</span><span><Clock3 size={13} /> {task.minutes}분</span><span className="importance">{Array.from({ length: 5 }, (_, i) => <i className={i < task.importance ? 'filled' : ''} key={i}>★</i>)}</span><span className={`status ${task.status.toLowerCase()}`}>{statusLabel[task.status]}</span></div></div><button className="more-button" onClick={() => showToast('태스크 상세 메뉴를 준비 중이에요.')}><MoreHorizontal size={19} /></button></div>)}<button className="add-task big-add" onClick={() => showToast('직접 태스크를 추가할 수 있어요.')}><Plus size={16} /> 직접 태스크 추가하기</button></section></>
}

function WorkspacePage({ activeNav, ...props }) {
  if (activeNav === '학습 목표') return <GoalPage {...props} />
  if (activeNav === '내 일정') return <SchedulePage {...props} />
  return <TaskPage {...props} />
}

function App() {
  const [auth, setAuth] = useState(loadSession)
  const [activeNav, setActiveNav] = useState('대시보드')
  const [tasks, setTasks] = useState(tasksSeed)
  const [toast, setToast] = useState('')
  const [isModalOpen, setModalOpen] = useState(false)
  const completed = tasks.filter(t => t.status === 'FINISHED').length
  const progress = Math.round((completed / tasks.length) * 100)

  useEffect(() => {
    if (!auth) return
    getMyProfile()
      .then(member => {
        const nextAuth = { ...auth, member }
        sessionStorage.setItem('member', JSON.stringify(member))
        setAuth(nextAuth)
      })
      .catch(() => setAuth(null))
  }, [])

  if (!auth) return <AuthPage onAuthenticated={setAuth} />

  const logout = () => {
    clearSession()
    setAuth(null)
  }

  const showToast = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2600) }
  const toggleTask = (id) => setTasks(current => current.map(t => t.id === id ? { ...t, status: t.status === 'FINISHED' ? 'PENDING' : 'FINISHED' } : t))
  const statusLabel = { PENDING: '예정', IN_PROGRESS: '진행 중', FINISHED: '완료' }
  const nickname = auth.member?.nickname || '사용자'
  const nicknameInitial = nickname.charAt(0)

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Sparkles size={17} fill="currentColor" /></span><span>Steady<span className="brand-accent">Teller</span></span></div>
      <div className="profile-mini"><div className="avatar">{nicknameInitial}</div><div><strong>{nickname}</strong><span>꾸준히, 나답게</span></div><ChevronDown size={15} /></div>
      <nav>
        <p className="nav-label">WORKSPACE</p>
        {[[LayoutDashboard, '대시보드'], [Target, '학습 목표'], [CalendarDays, '내 일정'], [BookOpen, '학습 태스크']].map(([Icon, label]) => <button key={label} className={activeNav === label ? 'nav-item active' : 'nav-item'} onClick={() => setActiveNav(label)}><Icon size={19} /><span>{label}</span>{label === '학습 태스크' && <span className="nav-count">4</span>}</button>)}
        <p className="nav-label nav-label-later">PERSONAL</p>
        <button className="nav-item" onClick={() => showToast('학습 통계는 다음 업데이트에서 만나요.')}><Zap size={19} /><span>학습 리포트</span><span className="soon">SOON</span></button>
        <button className="nav-item" onClick={() => showToast('설정 화면을 준비 중이에요.')}><Settings size={19} /><span>설정</span></button>
        <button className="nav-item" onClick={logout}><LogOut size={19} /><span>로그아웃</span></button>
      </nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={18} /></div><strong>Steady하게 시작해요</strong><p>목표를 세우면 AI가<br />나에게 맞는 계획을 짜드려요.</p><button onClick={() => setModalOpen(true)}>목표 설정하기 <ArrowRight size={14} /></button></div><div className="sidebar-foot"><span>© 2026 SteadyTeller</span><span>도움말</span></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><button className="mobile-menu"><Menu size={20} /></button><div className="breadcrumb">Workspace <span>/</span> {activeNav}</div><div className="top-actions"><button className="icon-button"><Search size={19} /></button><button className="icon-button notification"><Bell size={19} /><i /></button><div className="top-avatar">{nicknameInitial}</div></div></header>
      <div className="content-wrap">
        {activeNav !== '대시보드' && <WorkspacePage activeNav={activeNav} tasks={tasks} toggleTask={toggleTask} statusLabel={statusLabel} onCreate={() => setModalOpen(true)} showToast={showToast} />}
        {activeNav === '대시보드' && <>
        <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot" /> MONDAY, SEPTEMBER 8, 2026</div><h1>안녕하세요, {nickname}님 <span>👋</span></h1><p>오늘도 작은 한 걸음을 쌓아볼까요?</p></div><button className="primary-button" onClick={() => setModalOpen(true)}><Plus size={18} /> 새 목표 만들기</button></section>
        <section className="hero-grid"><div className="focus-card"><div className="focus-head"><div><span className="card-kicker">CURRENT GOAL</span><h2>정보처리기사<br /><em>합격하기</em></h2></div><div className="goal-icon"><Target size={26} /></div></div><div className="goal-meta"><span><CalendarDays size={15} /> D-42</span><span><Clock3 size={15} /> 하루 1시간</span><span className="goal-tag">진행 중</span></div><div className="hero-progress"><div><span>전체 진행률</span><strong>{progress}%</strong></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><small>4개 중 {completed}개 태스크 완료</small></div><button className="text-button" onClick={() => setActiveNav('학습 목표')}>목표 자세히 보기 <ArrowRight size={16} /></button></div><div className="streak-card"><div className="streak-top"><div><span className="card-kicker">MY RHYTHM</span><h3>이번 주 학습 리듬</h3></div><div className="flame"><Flame size={22} fill="currentColor" /></div></div><div className="streak-number"><strong>3</strong><span>일 연속<br />학습 중</span></div><div className="week-dots">{['월','화','수','목','금','토','일'].map((d, i) => <div key={d} className={i < 3 ? 'day done' : i === 3 ? 'day today' : 'day'}><span>{d}</span><i>{i < 3 ? <Check size={12} /> : ''}</i></div>)}</div><p className="streak-tip"><span>✦</span> 지금 흐름이 좋아요. 오늘도 이어가볼까요?</p></div></section>
        <section className="section-head"><div><h2>이번 주 일정</h2><p>가용 시간을 바탕으로 배치된 학습 계획이에요.</p></div><button className="outline-button" onClick={() => setActiveNav('내 일정')}>전체 일정 보기 <ArrowRight size={15} /></button></section>
        <section className="schedule-card"><div className="schedule-toolbar"><button className="month-button">2026년 9월 <ChevronDown size={15} /></button><div className="legend"><span><i className="legend-dot blue" /> 학습 예정</span><span><i className="legend-dot purple" /> 복습</span></div></div><div className="calendar-grid">{week.map((day, index) => <div className={index === 0 ? 'calendar-day selected' : 'calendar-day'} key={day.date}><div className="date-head"><span>{day.day}</span><strong>{day.date}</strong></div><div className="day-items">{day.items.length ? day.items.map((item, i) => <div className={`schedule-item ${item.state}`} key={i}><div className="item-time">{item.time}</div><strong>{item.title}</strong><span><Clock3 size={12} /> {item.minutes}분</span></div>) : <button className="empty-day" onClick={() => showToast(`${day.day}요일에 학습을 추가할 수 있어요.`)}><Plus size={16} /><span>학습 추가</span></button>}</div></div>)}</div></section>
        <section className="section-head tasks-head"><div><h2>학습 태스크 검토</h2><p>AI가 목표에 맞춰 제안한 태스크예요. 확인하고 나만의 계획을 완성해보세요.</p></div><button className="outline-button" onClick={() => setActiveNav('학습 태스크')}>전체 보기 <ArrowRight size={15} /></button></section>
        <section className="task-card"><div className="task-table-head"><span>학습 내용</span><span>분류</span><span>예상 시간</span><span>중요도</span><span>상태</span><span /></div>{tasks.map(task => <div className="task-row" key={task.id}><button className={task.status === 'FINISHED' ? 'check-box checked' : 'check-box'} onClick={() => toggleTask(task.id)}>{task.status === 'FINISHED' && <Check size={14} />}</button><div className={task.status === 'FINISHED' ? 'task-title completed' : 'task-title'}><strong>{task.title}</strong><span>{task.source === 'AI_GENERATED' ? '✦ AI 추천' : '직접 추가'} · {task.subject}</span></div><span className="category-pill">{task.category}</span><span className="minutes"><Clock3 size={14} /> {task.minutes}분</span><span className="importance">{Array.from({ length: 5 }, (_, i) => <i className={i < task.importance ? 'filled' : ''} key={i}>★</i>)}</span><span className={`status ${task.status.toLowerCase()}`}>{statusLabel[task.status]}</span><button className="more-button" onClick={() => showToast('태스크 상세 메뉴를 준비 중이에요.')}><MoreHorizontal size={18} /></button></div>)}<button className="add-task" onClick={() => showToast('새 태스크를 추가할 수 있어요.')}><Plus size={16} /> 직접 태스크 추가하기</button></section>
        <footer className="page-footer"><span><Sparkles size={14} /> 오늘의 꾸준함이 내일의 실력이 돼요.</span><span>마지막 동기화 · 방금 전</span></footer>
        </>}
      </div>
    </main>
    {isModalOpen && <div className="modal-backdrop" onClick={() => setModalOpen(false)}><div className="modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setModalOpen(false)}><X size={18} /></button><div className="modal-symbol"><Target size={24} /></div><span className="card-kicker">NEW GOAL</span><h2>새로운 목표를 시작해요</h2><p>목표와 학습 가능 시간을 알려주면<br />나에게 맞는 계획을 만들어드릴게요.</p><label>학습 목표<input defaultValue="정보처리기사 합격하기" /></label><label>집중 분야<input placeholder="예: 데이터베이스, 운영체제" /></label><button className="primary-button full" onClick={() => { setModalOpen(false); showToast('목표가 저장되었어요. 곧 맞춤 계획을 준비할게요!') }}>AI 계획 만들기 <Sparkles size={16} /></button></div></div>}
    {toast && <div className="toast"><Check size={16} /> {toast}</div>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
