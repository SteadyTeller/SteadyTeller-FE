import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Flame, RefreshCw, Target } from 'lucide-react'
import { dashboardApi } from '../api/dashboardApi.js'
import { useLearningData } from '../../shared/hooks/useLearningData.js'
import { dateLabel, formatMinutes, formatScheduleTime, partitionLearningItems, progressOf } from '../../shared/utils/learningData.js'
import './DashboardPage.css'

export default function DashboardPage({ member, onNavigate }) {
  const { goals, items, loading, error, refresh } = useLearningData(dashboardApi)
  const groups = partitionLearningItems(items)
  const focusItems = [...groups.overdue, ...groups.today].slice(0, 4)
  const activeGoals = goals.filter(goal => !['COMPLETED', 'DELETED'].includes(goal.status))
  const totalTodayMinutes = groups.today.reduce((sum, item) => sum + item.allocatedMinutes, 0)

  if (loading) return <DashboardLoading />

  return <div className="dashboard-page">
    <section className="dashboard-hero">
      <div>
        <p className="section-eyebrow">TODAY'S PLAN</p>
        <h1>{member?.nickname ?? '회원'}님, 오늘도 한 걸음씩 가볼까요?</h1>
        <p>{groups.today.length ? `오늘 ${groups.today.length}개의 학습이 기다리고 있어요.` : '오늘 예정된 학습이 없습니다. 다음 계획을 확인해보세요.'}</p>
      </div>
      <button className="primary-action" type="button" onClick={() => onNavigate('내 학습')}>학습 시작하기<ArrowRight size={17} /></button>
    </section>

    {error && <div className="inline-alert"><span>{error}</span><button type="button" onClick={refresh}><RefreshCw size={15} />다시 불러오기</button></div>}

    <section className="metric-grid" aria-label="학습 요약">
      <Metric icon={CalendarDays} label="오늘의 학습" value={`${groups.today.length}개`} detail={formatMinutes(totalTodayMinutes)} tone="green" />
      <Metric icon={Target} label="진행 중인 목표" value={`${activeGoals.length}개`} detail={activeGoals[0]?.title ?? '새 목표를 만들어보세요'} tone="lime" />
      <Metric icon={CheckCircle2} label="완료한 일정" value={`${groups.completed.length}개`} detail={`전체 진행률 ${progressOf(items)}%`} tone="blue" />
      <Metric icon={Flame} label="확인이 필요한 학습" value={`${groups.overdue.length + groups.failed.length}개`} detail="밀렸거나 실패한 일정" tone="orange" />
    </section>

    <div className="dashboard-columns">
      <section className="content-card today-card">
        <header className="card-heading"><div><p className="section-eyebrow">FOCUS</p><h2>지금 할 학습</h2></div><button type="button" onClick={() => onNavigate('내 학습')}>전체 보기<ArrowRight size={15} /></button></header>
        {focusItems.length ? <div className="focus-list">{focusItems.map(item => <article className="focus-item" key={item.scheduleItemId}>
          <div className="time-badge"><Clock3 size={15} /><strong>{formatScheduleTime(item)}</strong><span>{item.date === groups.today[0]?.date ? '오늘' : dateLabel(item.date)}</span></div>
          <div><span className="goal-chip">{item.goalTitle}</span><h3>{item.title}</h3><p>{item.subject || item.category || '학습 일정'}</p></div>
          <button type="button" onClick={() => onNavigate('내 학습')}>시작</button>
        </article>)}</div> : <EmptyBlock title="오늘 예정된 학습이 없어요" description="학습 관리에서 목표와 일정을 만들면 여기에 표시됩니다." action="학습 관리로 이동" onAction={() => onNavigate('학습 관리')} />}
      </section>

      <section className="content-card goal-card">
        <header className="card-heading"><div><p className="section-eyebrow">GOALS</p><h2>목표 진행 현황</h2></div><button type="button" onClick={() => onNavigate('학습 관리')}>관리하기<ArrowRight size={15} /></button></header>
        {activeGoals.length ? <div className="goal-progress-list">{activeGoals.slice(0, 4).map(goal => {
          const goalItems = items.filter(item => item.goalId === goal.id)
          const progress = progressOf(goalItems)
          return <article key={goal.id}>
            <div><h3>{goal.title}</h3><span>{goal.targetDate ? `${dateLabel(goal.targetDate)}까지` : '종료일 미정'}</span></div>
            <div className="progress-track" aria-label={`${goal.title} ${progress}% 완료`}><span style={{ width: `${progress}%` }} /></div>
            <p><strong>{progress}%</strong><span>{goalItems.filter(item => item.status === 'FINISHED').length}/{goalItems.length} 일정 완료</span></p>
          </article>
        })}</div> : <EmptyBlock title="진행 중인 목표가 없어요" description="이루고 싶은 목표를 만들고 AI 학습 계획을 받아보세요." action="목표 만들기" onAction={() => onNavigate('학습 관리')} />}
      </section>
    </div>
  </div>
}

function Metric({ icon: Icon, label, value, detail, tone }) {
  return <article className={`metric-card ${tone}`}><span><Icon size={18} /></span><div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div></article>
}

function EmptyBlock({ title, description, action, onAction }) {
  return <div className="empty-block"><CalendarDays size={27} /><h3>{title}</h3><p>{description}</p><button type="button" onClick={onAction}>{action}</button></div>
}

function DashboardLoading() {
  return <div className="dashboard-page loading-layout" aria-label="대시보드 불러오는 중"><div className="skeleton hero-skeleton" /><div className="metric-grid">{[1, 2, 3, 4].map(value => <div className="skeleton metric-skeleton" key={value} />)}</div><div className="skeleton panel-skeleton" /></div>
}
