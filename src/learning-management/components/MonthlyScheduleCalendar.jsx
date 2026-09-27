import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock3, X } from 'lucide-react'

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function monthLabel(year, month) {
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' }).format(new Date(year, month, 1))
}

function schedulesForDate(tasks, date) {
  return tasks.flatMap(task => task.schedules.map(schedule => ({
    ...schedule,
    taskTitle: task.title,
    allocatedMinutes: task.allocatedMinutes,
    isCompleted: task.status === 'COMPLETED',
  }))).filter(schedule => schedule.date === date)
}

function ScheduleDetailModal({ date, events, onClose }) {
  return <div className="management-modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="management-modal schedule-detail-modal" role="dialog" aria-modal="true" aria-labelledby="schedule-detail-title" onMouseDown={event => event.stopPropagation()}>
      <button type="button" className="management-modal-close" aria-label="닫기" onClick={onClose}><X size={18} /></button>
      <p className="section-label">DAILY SCHEDULE</p>
      <h2 id="schedule-detail-title">{date.year}년 {date.month + 1}월 {date.day}일</h2>
      <p className="management-modal-description">학습 태스크 {events.length}건</p>
      {events.length ? <div className="schedule-detail-list">{events.map((event, index) => <article className={event.isCompleted ? 'completed' : ''} key={`${event.taskTitle}-${event.startTime}-${index}`}><div><strong>{event.taskTitle}</strong><span><Clock3 size={13} />{event.endTime ? `${event.startTime} ~ ${event.endTime}` : event.startTime}</span></div><small>{event.allocatedMinutes}분</small></article>)}</div> : <p className="schedule-detail-empty">등록된 학습 태스크가 없습니다.</p>}
    </section>
  </div>
}

export default function MonthlyScheduleCalendar({ tasks, currentMonth, onMonthChange }) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [detail, setDetail] = useState(null)
  const [pickerDate, setPickerDate] = useState({ ...currentMonth, day: 1 })
  const { year, month } = currentMonth
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = new Date(year, month, 1).getDay()
  const calendarCellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7
  const calendarCells = Array.from({ length: calendarCellCount }, (_, index) => {
    const day = index - firstWeekday + 1
    return day < 1 || day > daysInMonth ? null : day
  })
  const yearOptions = useMemo(() => Array.from({ length: 11 }, (_, index) => year - 5 + index), [year])

  function moveMonth(offset) {
    const nextMonth = new Date(year, month + offset, 1)
    onMonthChange({ year: nextMonth.getFullYear(), month: nextMonth.getMonth() })
    setIsPickerOpen(false)
  }

  function openPicker() {
    setPickerDate(selectedDate ?? { year, month, day: 1 })
    setIsPickerOpen(true)
  }

  function updatePickerDate(key, value) {
    const next = { ...pickerDate, [key]: Number(value) }
    const availableDays = new Date(next.year, next.month + 1, 0).getDate()
    setPickerDate({ ...next, day: Math.min(next.day, availableDays) })
  }

  function applyPicker() {
    onMonthChange({ year: pickerDate.year, month: pickerDate.month })
    setSelectedDate(pickerDate)
    setIsPickerOpen(false)
  }

  function openScheduleDetail(day, events) {
    setSelectedDate({ year, month, day })
    setDetail({ date: { year, month, day }, events })
  }

  return <section className="schedule-management-section" aria-labelledby="schedule-calendar-title">
    <header className="section-heading"><div><p className="section-label">SCHEDULE</p><h2 id="schedule-calendar-title">월간 학습 일정</h2></div></header>
    <div className="calendar-toolbar">
      <button type="button" aria-label="이전 달" onClick={() => moveMonth(-1)}><ChevronLeft size={19} /></button>
      <button type="button" className="calendar-month-button" aria-haspopup="dialog" aria-expanded={isPickerOpen} onClick={openPicker}>{monthLabel(year, month)}</button>
      <button type="button" aria-label="다음 달" onClick={() => moveMonth(1)}><ChevronRight size={19} /></button>
    </div>
    {isPickerOpen && <div className="calendar-date-picker" role="dialog" aria-label="날짜 선택">
      <div className="calendar-picker-fields">
        <label>연도<select value={pickerDate.year} onChange={event => updatePickerDate('year', event.target.value)}>{yearOptions.map(option => <option key={option} value={option}>{option}년</option>)}</select></label>
        <label>월<select value={pickerDate.month} onChange={event => updatePickerDate('month', event.target.value)}>{Array.from({ length: 12 }, (_, index) => <option key={index} value={index}>{index + 1}월</option>)}</select></label>
        <label>일<select value={pickerDate.day} onChange={event => updatePickerDate('day', event.target.value)}>{Array.from({ length: new Date(pickerDate.year, pickerDate.month + 1, 0).getDate() }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}일</option>)}</select></label>
      </div>
      <div className="calendar-picker-actions"><button type="button" className="calendar-picker-confirm" onClick={applyPicker}>선택</button><button type="button" onClick={() => setIsPickerOpen(false)}>취소</button></div>
    </div>}
    <div className="calendar-weekdays">{weekdays.map(day => <span key={day}>{day}</span>)}</div>
    <div className="monthly-calendar">
      {calendarCells.map((day, index) => day == null ? <div className="calendar-empty" key={`empty-${index}`} /> : (() => {
        const date = toDateKey(year, month, day)
        const events = schedulesForDate(tasks, date)
        const isSelected = selectedDate?.year === year && selectedDate?.month === month && selectedDate?.day === day
        return <button type="button" className={isSelected ? 'calendar-day selected' : 'calendar-day'} key={date} onClick={() => openScheduleDetail(day, events)} aria-label={`${month + 1}월 ${day}일, 학습 태스크 ${events.length}건`}>
          <div className="calendar-day-head"><strong>{day}</strong>{events.length > 0 && <span>{events.length}건</span>}</div>
          <div className="calendar-task-names">{events.slice(0, 2).map((event, eventIndex) => <b className={event.isCompleted ? 'completed' : ''} key={`${event.taskTitle}-${eventIndex}`}>{event.taskTitle}</b>)}{events.length > 2 && <small>외 {events.length - 2}건</small>}</div>
        </button>
      })())}
    </div>
    {detail && <ScheduleDetailModal date={detail.date} events={detail.events} onClose={() => setDetail(null)} />}
  </section>
}
