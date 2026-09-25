import { useState } from 'react'
import { CalendarDays, ChevronDown, Clock3, Pencil, Plus, Target } from 'lucide-react'

export default function GoalManagementCard({ goal, goals, onSelectGoal }) {
  const [isGoalListOpen, setIsGoalListOpen] = useState(false)

  function selectGoal(goalId) {
    onSelectGoal(goalId)
    setIsGoalListOpen(false)
  }

  return <section className="goal-management-card" aria-labelledby="current-goal-title">
    <div className="goal-management-main">
      <div className="goal-management-icon"><Target size={25} /></div>
      <div className="goal-management-copy">
        <p className="section-label">CURRENT GOAL</p>
        <h2 id="current-goal-title">{goal.title}</h2>
        <p>{goal.description}</p>
        <div className="goal-management-meta"><span><CalendarDays size={14} />{goal.startDate} — {goal.targetDate}</span><span><Clock3 size={14} />{goal.studyFrequency}</span></div>
      </div>
    </div>
    <div className="goal-management-actions">
      <button type="button" className="secondary-action"><Pencil size={15} />목표 수정</button>
      <button type="button" className="primary-action">재계획하기</button>
      <div className="goal-selector">
        <button type="button" className="goal-switch-button" aria-haspopup="listbox" aria-expanded={isGoalListOpen} onClick={() => setIsGoalListOpen(current => !current)}>목표 변경<ChevronDown size={15} /></button>
        {isGoalListOpen && <div className="goal-options" role="listbox" aria-label="학습 목표 선택">
          {goals.map(item => <button type="button" role="option" aria-selected={item.id === goal.id} className={item.id === goal.id ? 'selected' : ''} key={item.id} onClick={() => selectGoal(item.id)}><strong>{item.title}</strong><small>{item.description}</small></button>)}
        </div>}
      </div>
      <button type="button" className="new-goal-button"><Plus size={15} />새 목표</button>
    </div>
  </section>
}
