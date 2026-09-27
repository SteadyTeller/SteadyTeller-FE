import { useMemo, useState } from 'react'
import { AlertCircle, BookOpen, CalendarDays, CheckCircle2, ChevronRight, Clock3, Filter, Play, RefreshCw } from 'lucide-react'
import LearningTimer from '../components/LearningTimer.jsx'
import { readTimer, timerStorageKey } from '../../legacy/timer.js'
import { learningApi } from '../../shared/api/learningApi.js'
import { useLearningData } from '../../shared/hooks/useLearningData.js'
import { dateLabel, formatScheduleTime, localDateKey, partitionLearningItems } from '../../shared/utils/learningData.js'
import './MyLearningPage.css'

const FILTERS = [
  ['today', '오늘'],
  ['upcoming', '예정'],
  ['completed', '완료'],
  ['failed', '실패'],
]

export default function MyLearningPage({ member }) {
  const { goals, items, loading, error, refresh } = useLearningData()
  const [filter, setFilter] = useState('today')
  const [goalId, setGoalId] = useState('all')
  const [timerItem, setTimerItem] = useState(null)
  const [startingId, setStartingId] = useState(null)
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const groups = partitionLearningItems(items)
  const visibleItems = useMemo(() => {
    const source = filter === 'today' ? [...groups.overdue, ...groups.today] : groups[filter] ?? []
    return goalId === 'all' ? source : source.filter(item => String(item.goalId) === goalId)
  }, [filter, goalId, groups.today, groups.overdue, groups.upcoming, groups.completed, groups.failed])

  async function start(item) {
    setStartingId(item.scheduleItemId)
    setActionError('')
    try {
      const savedTimer = readTimer(localStorage, timerStorageKey(member.id))
      if (savedTimer && savedTimer.scheduleItemId !== item.scheduleItemId) {
        const savedItem = items.find(value => value.scheduleItemId === savedTimer.scheduleItemId)
        if (savedItem) {
          setNotice(`진행 중인 '${savedItem.title}' 학습을 먼저 이어갑니다.`)
          setTimerItem(savedItem)
          return
        }
        localStorage.removeItem(timerStorageKey(member.id))
      }
      if (item.status === 'PENDING') await learningApi.startScheduleItem(item.scheduleId, item.scheduleItemId)
      setTimerItem({ ...item, status: 'IN_PROGRESS' })
    } catch (startError) {
      setActionError(startError.message || '학습을 시작하지 못했습니다.')
    } finally {
      setStartingId(null)
    }
  }

  async function handleSaved({ synced, result }) {
    setTimerItem(null)
    setNotice(synced ? '학습 결과를 저장했습니다.' : `${result === 'COMPLETED' ? '완료' : '실패'} 상태는 반영했고, 상세 시간 기록은 연결 대기 중입니다.`)
    await refresh()
  }

  if (loading) return <div className="learning-page"><div className="learning-intro skeleton learning-skeleton" /><div className="learning-body"><div className="skeleton learning-side-skeleton" /><div className="skeleton learning-list-skeleton" /></div></div>

  return <div className="learning-page">
    <section className="learning-intro">
      <div><p className="section-eyebrow">MY STUDY</p><h1>오늘의 학습을 시작해보세요</h1><p>일정을 확인하고 타이머로 실제 학습 시간을 기록할 수 있어요.</p></div>
      <div className="today-summary"><CalendarDays size={18} /><div><span>{dateLabel(localDateKey())}</span><strong>{groups.today.length}개 · {groups.today.reduce((sum, item) => sum + item.allocatedMinutes, 0)}분</strong></div></div>
    </section>

    {(error || actionError) && <div className="inline-alert"><span>{actionError || error}</span><button type="button" onClick={refresh}><RefreshCw size={15} />다시 불러오기</button></div>}
    {notice && <div className="success-notice" role="status"><CheckCircle2 size={16} />{notice}<button type="button" onClick={() => setNotice('')}>확인</button></div>}

    <div className="learning-body">
      <aside className="learning-sidebar">
        <div className="sidebar-title"><Filter size={15} /><strong>학습 보기</strong></div>
        <nav>{FILTERS.map(([value, label]) => <button type="button" className={filter === value ? 'active' : ''} key={value} onClick={() => setFilter(value)}><span>{label}</span><em>{value === 'today' ? groups.today.length + groups.overdue.length : groups[value]?.length ?? 0}</em></button>)}</nav>
        <label><span>목표 선택</span><select value={goalId} onChange={event => setGoalId(event.target.value)}><option value="all">모든 목표</option>{goals.map(goal => <option value={goal.id} key={goal.id}>{goal.title}</option>)}</select></label>
      </aside>

      <section className="learning-list-card">
        <header><div><p className="section-eyebrow">{FILTERS.find(([value]) => value === filter)?.[1].toUpperCase()}</p><h2>{filter === 'today' ? '오늘 할 학습' : `${FILTERS.find(([value]) => value === filter)?.[1]}한 학습`}</h2></div><span>{visibleItems.length}개</span></header>
        {visibleItems.length ? <div className="learning-item-list">{visibleItems.map(item => <LearningItem item={item} canStart={['PENDING', 'IN_PROGRESS'].includes(item.status) && filter === 'today'} isStarting={startingId === item.scheduleItemId} onStart={() => start(item)} key={`${item.scheduleId}-${item.scheduleItemId}`} />)}</div> : <LearningEmpty filter={filter} />}
      </section>
    </div>

    {timerItem && <LearningTimer memberId={member.id} item={timerItem} onClose={() => setTimerItem(null)} onSaved={handleSaved} />}
  </div>
}

function LearningItem({ item, canStart, isStarting, onStart }) {
  const isOverdue = item.date < localDateKey() && !['FINISHED', 'FAILED'].includes(item.status)
  return <article className={`learning-item ${item.status.toLowerCase()}`}>
    <div className="learning-date"><strong>{dateLabel(item.date)}</strong><span>{formatScheduleTime(item)}</span></div>
    <div className="learning-item-main"><div><span className="goal-chip">{item.goalTitle}</span>{isOverdue && <span className="overdue-chip">미뤄진 일정</span>}</div><h3>{item.title}</h3><p>{item.subject || item.category || '학습 내용'} · 예정 {item.allocatedMinutes}분</p></div>
    <StatusBadge status={item.status} />
    {canStart ? <button type="button" className="start-study-button" disabled={isStarting} onClick={onStart}>{isStarting ? <Clock3 size={16} /> : <Play size={16} fill="currentColor" />}{isStarting ? '시작 중' : item.status === 'IN_PROGRESS' ? '이어하기' : '시작'}</button> : <ChevronRight size={17} className="item-chevron" />}
  </article>
}

function StatusBadge({ status }) {
  const labels = { PENDING: '예정', IN_PROGRESS: '진행 중', FINISHED: '완료', FAILED: '실패' }
  return <span className={`status-badge ${status.toLowerCase()}`}>{labels[status] ?? status}</span>
}

function LearningEmpty({ filter }) {
  const complete = filter === 'completed'
  return <div className="learning-empty">{complete ? <CheckCircle2 size={32} /> : filter === 'failed' ? <AlertCircle size={32} /> : <BookOpen size={32} />}<h3>{complete ? '아직 완료한 학습이 없어요' : filter === 'failed' ? '실패한 학습이 없어요' : '표시할 학습 일정이 없어요'}</h3><p>{filter === 'today' ? '학습 관리에서 일정을 확정하면 오늘 계획을 확인할 수 있습니다.' : '다른 상태의 학습을 확인해보세요.'}</p></div>
}
