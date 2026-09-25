import { CheckCircle2, Circle, Sparkles } from 'lucide-react'

function scheduleLabel(schedule) {
  const date = new Date(`${schedule.date}T00:00:00`)
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${schedule.time}`
}

export default function TaskList({ tasks, onGenerateTasks, isGenerating, generationMessage }) {
  return <section className="task-management-section" aria-labelledby="task-list-title">
    <header className="section-heading">
      <div><p className="section-label">TASKS</p><h2 id="task-list-title">태스크 목록</h2><span>확정된 태스크는 배정된 일정과 함께 표시됩니다.</span></div>
      <button type="button" className="add-task-button" onClick={onGenerateTasks} disabled={isGenerating}><Sparkles size={16} />{isGenerating ? '태스크 생성 중...' : 'AI 태스크 생성'}</button>
    </header>
    <div className="task-management-list">
      {tasks.map(task => <article className={`managed-task ${task.status.toLowerCase()}`} key={task.id}>
        {task.status === 'COMPLETED' ? <CheckCircle2 className="task-status-icon complete" size={20} /> : <Circle className="task-status-icon" size={20} />}
        <div className="managed-task-copy"><div><h3>{task.title}</h3><span className="task-subject">{task.subject}</span></div><p>{task.allocatedMinutes}분</p>{task.schedules.length > 0 && <div className="task-schedules">{task.schedules.map(schedule => <span key={`${task.id}-${schedule.date}-${schedule.time}`}><i />{scheduleLabel(schedule)}</span>)}</div>}</div>
        <span className="task-state">{task.status === 'DRAFT' ? '미확정' : task.status === 'COMPLETED' ? '완료' : '확정'}</span>
      </article>)}
    </div>
    {generationMessage && <p className="task-generation-message">{generationMessage}</p>}
  </section>
}
