import test from 'node:test'
import assert from 'node:assert/strict'
import { flattenScheduledTasks, partitionLearningItems, progressOf } from './learningData.js'

test('목표별 태스크의 일정 항목을 시간순으로 합친다', () => {
  const goals = [{ id: 1, title: '자격증' }]
  const tasks = { 1: [{ id: 9, title: '개념', scheduleItems: [{ scheduleId: 2, scheduleItemId: 4, date: '2026-09-29', startTime: '19:00' }] }] }
  assert.deepEqual(flattenScheduledTasks(goals, tasks).map(item => item.title), ['개념'])
})

test('오늘·지연·예정 항목을 상태와 날짜로 나눈다', () => {
  const items = [
    { date: '2026-09-27', status: 'PENDING' },
    { date: '2026-09-28', status: 'IN_PROGRESS' },
    { date: '2026-09-29', status: 'PENDING' },
    { date: '2026-09-28', status: 'FINISHED' },
  ]
  const result = partitionLearningItems(items, '2026-09-28')
  assert.equal(result.overdue.length, 1)
  assert.equal(result.today.length, 1)
  assert.equal(result.upcoming.length, 1)
  assert.equal(result.completed.length, 1)
})

test('완료 비율은 전체 일정 항목을 기준으로 계산한다', () => {
  assert.equal(progressOf([{ status: 'FINISHED' }, { status: 'PENDING' }]), 50)
  assert.equal(progressOf([]), 0)
})
