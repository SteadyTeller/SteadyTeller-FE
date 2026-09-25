import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react'

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function monthLabel(year, month) {
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' }).format(new Date(year, month, 1))
}

function schedulesForDate(tasks, date) {
  return tasks.flatMap(task => task.schedules.map(schedule => ({ ...schedule, taskTitle: task.title, allocatedMinutes: task.allocatedMinutes }))).filter(schedule => schedule.date === date)
}

export default function MonthlyScheduleCalendar({ tasks, currentMonth, onMonthChange }) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
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

  function selectDay(day) {
    setSelectedDate({ year, month, day })
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
        return <button type="button" className={isSelected ? 'calendar-day selected' : 'calendar-day'} key={date} onClick={() => selectDay(day)} aria-label={`${month + 1}월 ${day}일${events.length ? `, 학습 일정 ${events.length}개` : ''}`}>
          <strong>{day}</strong><div className="calendar-events">{events.map(event => <span key={`${event.taskTitle}-${event.time}`} className="calendar-event"><span><Clock3 size={10} />{event.time}</span><b>{event.taskTitle}</b><small>{event.allocatedMinutes}분</small></span>)}</div>
        </button>
      })())}
    </div>
    {selectedDate && <p className="selected-date-notice"><CalendarDays size={13} />{selectedDate.year}년 {selectedDate.month + 1}월 {selectedDate.day}일을 선택했어요.</p>}
  </section>
}
