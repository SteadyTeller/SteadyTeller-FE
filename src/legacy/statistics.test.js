import test from 'node:test'
import assert from 'node:assert/strict'
import { clampPercentage, formatMinutes, statisticsDateRange } from './statistics.js'

test('진행률을 0~100 범위로 제한한다', () => {
  assert.equal(clampPercentage(-10), 0)
  assert.equal(clampPercentage(42.5), 42.5)
  assert.equal(clampPercentage(120), 100)
  assert.equal(clampPercentage(undefined), 0)
})

test('계획 시간을 읽기 쉬운 시간과 분으로 표시한다', () => {
  assert.equal(formatMinutes(0), '0분')
  assert.equal(formatMinutes(60), '1시간')
  assert.equal(formatMinutes(135), '2시간 15분')
})

test('목표의 시작일과 목표일을 통계 조회 범위로 사용한다', () => {
  assert.deepEqual(
    statisticsDateRange(
      { startDate: '2026-09-01', targetDate: '2026-09-30' },
      '2026-09-15',
    ),
    { startDate: '2026-09-01', endDate: '2026-09-15' },
  )
  assert.equal(statisticsDateRange(null), null)
})

test('미래 목표도 시작일보다 앞선 통계 범위를 만들지 않는다', () => {
  assert.deepEqual(
    statisticsDateRange(
      { startDate: '2026-10-01', targetDate: '2026-10-31' },
      '2026-09-15',
    ),
    { startDate: '2026-10-01', endDate: '2026-10-01' },
  )
})
