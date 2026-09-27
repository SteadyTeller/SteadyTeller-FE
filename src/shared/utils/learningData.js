export function localDateKey(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
}

export function flattenScheduledTasks(goals, tasksByGoal) {
  return goals.flatMap(goal => (tasksByGoal[goal.id] ?? []).flatMap(task =>
    (task.scheduleItems ?? []).map(item => ({ ...item, taskId: task.id, title: task.title, subject: task.subject, category: task.category, difficulty: task.difficulty, goalId: goal.id, goalTitle: goal.title, goalTargetDate: goal.targetDate }))))
    .sort((a, b) => `${a.date}T${a.startTime ?? '00:00'}`.localeCompare(`${b.date}T${b.startTime ?? '00:00'}`))
}

export function partitionLearningItems(items, today = localDateKey()) {
  const unfinished = items.filter(item => !['FINISHED', 'FAILED'].includes(item.status))
  return {
    today: unfinished.filter(item => item.date === today),
    overdue: unfinished.filter(item => item.date < today),
    upcoming: unfinished.filter(item => item.date > today),
    completed: items.filter(item => item.status === 'FINISHED'),
    failed: items.filter(item => item.status === 'FAILED'),
  }
}

export function formatMinutes(minutes) {
  const total = Math.max(0, Number(minutes) || 0)
  const hours = Math.floor(total / 60)
  const rest = total % 60
  if (!hours) return `${rest}분`
  return rest ? `${hours}시간 ${rest}분` : `${hours}시간`
}

export function formatScheduleTime(item) {
  if (item.startTime && item.endTime) return `${String(item.startTime).slice(0, 5)}–${String(item.endTime).slice(0, 5)}`
  return formatMinutes(item.allocatedMinutes)
}

export function progressOf(items) {
  if (!items.length) return 0
  return Math.round(items.filter(item => item.status === 'FINISHED').length / items.length * 100)
}

export function dateLabel(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' }).format(new Date(`${value}T00:00:00`))
}
