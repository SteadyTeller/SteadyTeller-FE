import { useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart3, CalendarRange, CheckCircle2, Clock3, Flame, RefreshCw, Target } from 'lucide-react'
import { learningApi } from '../../shared/api/learningApi.js'
import { statisticsApi } from '../../shared/api/statisticsApi.js'
import { formatMinutes, localDateKey } from '../../shared/utils/learningData.js'
import './RecordsPage.css'

export default function RecordsPage() {
  const initialRange = useMemo(() => defaultRange(), [])
  const [range, setRange] = useState(initialRange)
  const [appliedRange, setAppliedRange] = useState(initialRange)
  const [data, setData] = useState({ summary: null, daily: [], goals: [], goalStats: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const goals = await learningApi.getGoals()
      const [summary, daily, goalResults] = await Promise.all([
        statisticsApi.getSummary(appliedRange.startDate, appliedRange.endDate),
        statisticsApi.getDaily(appliedRange.startDate, appliedRange.endDate),
        Promise.allSettled(goals.map(goal => statisticsApi.getGoal(goal.id))),
      ])
      setData({ summary, daily, goals, goalStats: goalResults.map((result, index) => result.status === 'fulfilled' ? { ...result.value, title: goals[index].title, targetDate: goals[index].targetDate } : null).filter(Boolean) })
    } catch (requestError) {
      setError(requestError.message || '학습 기록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [appliedRange])

  useEffect(() => { load() }, [load])

  function applyRange(event) {
    event.preventDefault()
    if (range.startDate > range.endDate) {
      setError('시작일은 종료일보다 늦을 수 없습니다.')
      return
    }
    setAppliedRange({ ...range })
  }

  const maxCount = Math.max(1, ...data.daily.map(day => day.scheduleCount))

  return <div className="records-page">
    <section className="records-header"><div><p className="section-eyebrow">LEARNING RECORDS</p><h1>학습 기록</h1><p>계획과 실제 수행 결과를 기간별로 확인해보세요.</p></div><form onSubmit={applyRange}><CalendarRange size={16} /><label><span className="sr-only">시작일</span><input type="date" value={range.startDate} max={range.endDate} onChange={event => setRange(current => ({ ...current, startDate: event.target.value }))} /></label><i>–</i><label><span className="sr-only">종료일</span><input type="date" value={range.endDate} min={range.startDate} max={localDateKey()} onChange={event => setRange(current => ({ ...current, endDate: event.target.value }))} /></label><button>조회</button></form></section>

    {error && <div className="inline-alert"><span>{error}</span><button type="button" onClick={load}><RefreshCw size={15} />다시 불러오기</button></div>}

    {loading ? <RecordsLoading /> : <>
      <section className="record-metrics">
        <RecordMetric icon={CheckCircle2} label="완료한 일정" value={`${data.summary?.completedSchedules ?? 0}개`} detail={`전체 ${data.summary?.totalSchedules ?? 0}개`} />
        <RecordMetric icon={Target} label="일정 수행률" value={`${Math.round(data.summary?.completionRate ?? 0)}%`} detail="선택 기간 기준" />
        <RecordMetric icon={Clock3} label="계획 학습 시간" value={formatMinutes(data.summary?.totalPlannedMinutes ?? 0)} detail="예정된 전체 시간" />
        <RecordMetric icon={Flame} label="연속 학습" value={`${data.summary?.consecutiveStudyDays ?? 0}일`} detail="꾸준히 학습한 날" />
      </section>

      <div className="records-grid">
        <section className="record-card activity-chart-card"><header><div><p className="section-eyebrow">DAILY ACTIVITY</p><h2>날짜별 수행 기록</h2></div><span>{appliedRange.startDate} – {appliedRange.endDate}</span></header>
          {data.daily.length ? <div className="activity-chart" aria-label="날짜별 학습 수행 차트">{data.daily.map(day => <div className="activity-column" key={day.studyDate} title={`${day.studyDate}: ${day.completedCount}/${day.scheduleCount}개 완료`}><div className="bar-area"><span className="planned-bar" style={{ height: `${day.scheduleCount / maxCount * 100}%` }} /><span className="completed-bar" style={{ height: `${day.completedCount / maxCount * 100}%` }} /></div><small>{formatChartDate(day.studyDate)}</small></div>)}</div> : <RecordEmpty icon={BarChart3} title="선택한 기간의 기록이 없어요" description="학습을 완료하면 날짜별 수행 기록이 쌓입니다." />}
          {data.daily.length > 0 && <div className="chart-legend"><span><i className="planned" />예정</span><span><i className="completed" />완료</span></div>}
        </section>

        <section className="record-card goal-record-card"><header><div><p className="section-eyebrow">BY GOAL</p><h2>목표별 진행률</h2></div></header>
          {data.goalStats.length ? <div className="goal-stat-list">{data.goalStats.map(goal => <article key={goal.goalId}><div><h3>{goal.title}</h3><strong>{Math.round(goal.progressRate ?? 0)}%</strong></div><div className="record-progress"><span style={{ width: `${Math.min(100, Math.max(0, goal.progressRate ?? 0))}%` }} /></div><p><span>{goal.completedSchedules}/{goal.totalSchedules}개 일정 완료</span><span>{formatMinutes(goal.totalPlannedMinutes)}</span></p></article>)}</div> : <RecordEmpty icon={Target} title="목표 기록이 없어요" description="목표와 일정을 생성하면 진행률을 확인할 수 있습니다." />}
        </section>
      </div>

      <section className="record-card daily-table-card"><header><div><p className="section-eyebrow">DETAIL</p><h2>일별 기록 상세</h2></div></header>
        {data.daily.length ? <div className="daily-table"><div className="daily-table-head"><span>날짜</span><span>완료 / 전체</span><span>수행률</span><span>계획 시간</span></div>{[...data.daily].reverse().map(day => <div className="daily-table-row" key={day.studyDate}><strong>{day.studyDate}</strong><span>{day.completedCount} / {day.scheduleCount}</span><span><em>{Math.round(day.completionRate ?? 0)}%</em></span><span>{formatMinutes(day.plannedMinutes)}</span></div>)}</div> : <RecordEmpty icon={CalendarRange} title="표시할 상세 기록이 없어요" description="기간을 변경하거나 학습을 먼저 진행해주세요." />}
      </section>
    </>}
  </div>
}

function RecordMetric({ icon: Icon, label, value, detail }) { return <article><span><Icon size={17} /></span><div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div></article> }
function RecordEmpty({ icon: Icon, title, description }) { return <div className="record-empty"><Icon size={29} /><h3>{title}</h3><p>{description}</p></div> }
function RecordsLoading() { return <div className="records-loading"><div className="record-metrics">{[1,2,3,4].map(value => <div className="skeleton" key={value} />)}</div><div className="skeleton records-panel-skeleton" /></div> }
function defaultRange() { const end = new Date(); const start = new Date(); start.setDate(end.getDate() - 29); return { startDate: localDateKey(start), endDate: localDateKey(end) } }
function formatChartDate(date) { const [, month, day] = date.split('-'); return `${Number(month)}/${Number(day)}` }
