import {useState} from 'react'
import {Plus, Target, X} from 'lucide-react'

const emptyGoal = {
    title: '',
    startDate: new Date().toISOString().slice(0, 10),
    targetDate: '',
    currentLevel: 'BEGINNER',
    mustStudyTopics: []
}

export default function GoalFormModal({mode, goal, onClose, onSave}) {
    const [form, setForm] = useState({...emptyGoal, ...goal})
    const [topics, setTopics] = useState(goal?.mustStudyTopics ?? [])
    const [topicInput, setTopicInput] = useState('')
    const [error, setError] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const isEdit = mode === 'edit'
    const update = (key, value) => setForm(current => ({...current, [key]: value}))

    function addTopic() {
        const topic = topicInput.trim()
        if (!topic) return
        if (topics.includes(topic)) {
            setError('이미 추가한 학습 주제입니다.');
            return
        }
        setTopics(current => [...current, topic])
        setTopicInput('')
        setError('')
    }

    async function submit(event) {
        event.preventDefault()
        if (!topics.length) {
            setError('필수 학습 주제를 한 개 이상 추가해주세요.');
            return
        }
        setError('')
        setIsSaving(true)
        try {
            await onSave({
                title: form.title,
                startDate: form.startDate,
                targetDate: form.targetDate,
                currentLevel: form.currentLevel,
                mustStudyTopics: topics
            })
        } catch (requestError) {
            setError(requestError.message)
        } finally {
            setIsSaving(false)
        }
    }

    return <div className="management-modal-backdrop" role="presentation" onMouseDown={onClose}>
        <section className="management-modal" role="dialog" aria-modal="true" aria-labelledby="goal-form-title"
                 onMouseDown={event => event.stopPropagation()}>
            <button type="button" className="management-modal-close" aria-label="창 닫기" onClick={onClose}><X size={18}/>
            </button>
            <div className="management-modal-icon"><Target size={21}/></div>
            <p className="section-label">GOAL</p><h2 id="goal-form-title">{isEdit ? '학습 목표 수정' : '새 학습 목표 만들기'}</h2><p
            className="management-modal-description">목표 API에 필요한 학습 정보를 입력하세요.</p>
            <form onSubmit={submit}><label>학습 목표<input className="goal-text-input" required value={form.title}
                                                       onChange={event => update('title', event.target.value)}
                                                       placeholder="달성하고 싶은 목표를 입력하세요."/></label>
                <div className="management-form-grid"><label>시작일<input type="date" required value={form.startDate}
                                                                       onChange={event => update('startDate', event.target.value)}/></label><label>목표일<input
                    type="date" required value={form.targetDate}
                    onChange={event => update('targetDate', event.target.value)}/></label></div>
                <label>현재 수준<select value={form.currentLevel}
                                    onChange={event => update('currentLevel', event.target.value)}>
                    <option value="BEGINNER">초급</option>
                    <option value="INTERMEDIATE">중급</option>
                    <option value="ADVANCED">고급</option>
                </select></label>
                <div className="topic-field">
                    <div><strong>필수 학습 주제</strong><span className="form-hint">주제를 하나씩 추가하세요.</span></div>
                    <div className="topic-input-row"><input className="goal-text-input" value={topicInput}
                                                            onChange={event => setTopicInput(event.target.value)}
                                                            onKeyDown={event => {
                                                                if (event.key === 'Enter') {
                                                                    event.preventDefault();
                                                                    addTopic()
                                                                }
                                                            }} placeholder="꼭 배우고 싶은 주제를 입력해주세요."/>
                        <button type="button" onClick={addTopic}><Plus size={14}/>추가</button>
                    </div>
                    <div className="topic-list" aria-live="polite">{topics.length ? topics.map(topic => <span
                        key={topic}>{topic}
                        <button type="button" aria-label={`${topic} 삭제`}
                                onClick={() => setTopics(current => current.filter(item => item !== topic))}><X
                            size={12}/></button></span>) : <small>아직 추가한 학습 주제가 없어요.</small>}</div>
                </div>
                {error && <p className="management-modal-error">{error}</p>}
                <div className="management-modal-actions">
                    <button type="button" onClick={onClose} disabled={isSaving}>취소</button>
                    <button type="submit"
                            disabled={isSaving}>{isSaving ? '저장 중...' : isEdit ? '수정 내용 저장' : '목표 만들기'}</button>
                </div>
            </form>
        </section>
    </div>
}
