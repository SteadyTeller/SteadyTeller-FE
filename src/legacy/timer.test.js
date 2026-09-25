import test from 'node:test'
import assert from 'node:assert/strict'
import { elapsedSeconds, pauseTimer, resumeTimer, formatElapsed, timerStorageKey } from './timer.js'
import { readTimer, validateResult, upsertDraft } from './timer.js'

test('running timer is restored from timestamps rather than interval ticks', () => {
  const timer = JSON.parse(JSON.stringify({ elapsedSeconds: 10, runningSince: 1000 }))
  assert.equal(elapsedSeconds(timer, 61000), 70)
})
test('pause excludes breaks and repeated resume does not reset start', () => {
  const paused = pauseTimer({ elapsedSeconds: 0, runningSince: 1000 }, 31000)
  assert.equal(elapsedSeconds(paused, 100000), 30)
  const resumed = resumeTimer(paused, 100000)
  assert.equal(resumeTimer(resumed, 110000), resumed)
  assert.equal(elapsedSeconds(resumed, 120000), 50)
})
test('clock moving backwards never subtracts study time', () => {
  assert.equal(elapsedSeconds({ elapsedSeconds: 8, runningSince: 10000 }, 0), 8)
})
test('duration formatting and member isolation', () => {
  assert.equal(formatElapsed(3661), '01:01:01')
  assert.notEqual(timerStorageKey(1), timerStorageKey(2))
})

test('corrupted or invalid timer snapshots are not resumed', () => {
  for (const value of ['{', '{}', 'null', '{"elapsedSeconds":-1}']) {
    assert.equal(readTimer({ getItem: () => value }, 'test'), null)
  }
  const value = { attemptId: 'attempt', scheduleId: 1, scheduleItemId: 2, allocatedMinutes: 30, elapsedSeconds: 60, runningSince: null, form: { learned: 'JWT 기초', ending: true } }
  assert.deepEqual(readTimer({ getItem: () => JSON.stringify(value) }, 'test'), value)
})
test('result validation rejects empty and fractional times and requires failure reason', () => {
  assert.equal(validateResult('', 'COMPLETED', ''), false)
  assert.equal(validateResult('1.5', 'COMPLETED', ''), false)
  assert.equal(validateResult('0', 'FAILED', ''), false)
  assert.equal(validateResult('0', 'FAILED', '개인 일정'), true)
  assert.equal(validateResult('1441', 'COMPLETED', ''), false)
})
test('retry drafts preserve previous attempts and repeated submission replaces only its own draft', () => {
  const first = { attemptId: 'first', result: 'FAILED' }
  const second = { attemptId: 'second', result: 'COMPLETED' }
  assert.deepEqual(upsertDraft([first], second), [first, second])
  assert.deepEqual(upsertDraft([first, second], second), [first, second])
  assert.throws(() => upsertDraft({}, second))
})
