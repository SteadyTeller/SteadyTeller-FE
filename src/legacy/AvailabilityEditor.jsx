import { useEffect, useState } from 'react'
import { Clock3 } from 'lucide-react'
import { api } from './api.js'
import { fullDays, minutesFromTime, timeFromMinutes, validateAvailability } from './availability.js'
import './availability.css'

const labels = ['월', '화', '수', '목', '금', '토', '일']

export default function AvailabilityEditor() {
  const [slots, setSlots] = useState([])
  const [request, setRequest] = useState({ dayOfWeek: 'MONDAY', startTime: '18:00', endTime: '20:00', enabled: true })
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [editingId, setEditingId] = useState(null)
  useEffect(() => {
    let cancelled = false
    api.availabilities().then(values => { if (!cancelled) { setSlots(values); setReady(true) } }).catch(err => { if (!cancelled) setError(err.message) }).finally(() => { if (!cancelled) setBusy(false) })
    return () => { cancelled = true }
  }, [])
  function update(field, value) { setRequest(current => ({ ...current, [field]: value })) }
  async function add() {
    if (busy || !ready) return
    const validation = validateAvailability(request, slots.filter(slot => slot.id !== editingId))
    if (validation) return setError(validation)
    setBusy(true); setError('')
    try {
      const saved = editingId == null ? await api.createAvailability(request) : await api.updateAvailability(editingId, request)
      setSlots(current => editingId == null ? [...current, saved] : current.map(slot => slot.id === editingId ? saved : slot))
      setEditingId(null)
    }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  async function remove(id) {
    if (busy) return
    setBusy(true); setError('')
    try { await api.deleteAvailability(id); setSlots(current => current.filter(value => value.id !== id)); if (editingId === id) setEditingId(null) }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  const start = minutesFromTime(request.startTime)
  const end = minutesFromTime(request.endTime)
  return <section className="availability-editor" aria-label="가용 시간대 설정">
    <h3><Clock3 size={16} /> 학습 가능 시간대</h3>
    <p>회원 공통 설정이며 시간대 추가·삭제 시 바로 저장됩니다. 목표 저장과 별개입니다.</p>
    <label>요일<select value={request.dayOfWeek} onChange={event => update('dayOfWeek', event.target.value)}>{fullDays.map((day, index) => <option key={day} value={day}>{labels[index]}요일</option>)}</select></label>
    <div className="availability-times"><label>시작<input type="time" step="900" value={request.startTime} onChange={event => update('startTime', event.target.value)} /></label><label>종료<input type="time" step="900" value={request.endTime} onChange={event => update('endTime', event.target.value)} /></label></div>
    <label>시작 시각 드래그<input type="range" min="0" max="1425" step="15" value={Number.isFinite(start) ? start : 0} onChange={event => update('startTime', timeFromMinutes(Number(event.target.value)))} /></label>
    <label>종료 시각 드래그<input type="range" min="15" max="1425" step="15" value={Number.isFinite(end) ? end : 15} onChange={event => update('endTime', timeFromMinutes(Number(event.target.value)))} /></label>
    <output>{request.startTime} ~ {request.endTime} · {end > start ? end - start : 0}분</output>
    <button type="button" disabled={busy || !ready} onClick={add}>{editingId == null ? '시간대 추가·저장' : '시간대 수정·저장'}</button>
    {editingId != null && <button type="button" disabled={busy} onClick={() => setEditingId(null)}>수정 취소</button>}
    <ul>{slots.map(slot => <li key={slot.id}>{labels[fullDays.indexOf(slot.dayOfWeek)]} {slot.startTime.slice(0, 5)}~{slot.endTime.slice(0, 5)} ({slot.availableMinutes}분){!slot.enabled && ' · 비활성'} <button type="button" disabled={busy} onClick={() => { setEditingId(slot.id); setRequest({ dayOfWeek: slot.dayOfWeek, startTime: slot.startTime.slice(0, 5), endTime: slot.endTime.slice(0, 5), enabled: slot.enabled }); setError('') }}>수정</button><button type="button" disabled={busy} onClick={() => remove(slot.id)}>삭제</button></li>)}</ul>
    <p>저장된 주간 총 가용시간: {slots.filter(slot => slot.enabled).reduce((sum, slot) => sum + slot.availableMinutes, 0)}분</p>
    <small>이 시간대를 실제 일정 배치에 사용하는 연결은 스케줄링 담당 작업 후 활성화됩니다. 현재 하루 시간·요일 입력도 유지합니다.</small>
    {error && <p role="alert">{error}</p>}
  </section>
}
