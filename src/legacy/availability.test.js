import test from 'node:test'
import assert from 'node:assert/strict'
import { validateAvailability, minutesFromTime, timeFromMinutes } from './availability.js'
const slot = { dayOfWeek: 'MONDAY', startTime: '18:00', endTime: '20:00' }
test('availability validates inverted, invalid and overlapping intervals', () => {
  assert.ok(validateAvailability({ ...slot, endTime: '17:00' }, []))
  assert.ok(validateAvailability({ ...slot, startTime: '25:00' }, []))
  assert.ok(validateAvailability({ ...slot, startTime: '19:00' }, [slot]))
})
test('adjacent slots and different weekdays are allowed', () => {
  assert.equal(validateAvailability({ ...slot, startTime: '20:00', endTime: '21:30' }, [slot]), '')
  assert.equal(validateAvailability({ ...slot, dayOfWeek: 'TUESDAY' }, [slot]), '')
})
test('time conversion supports server seconds and fifteen minute timeline', () => {
  assert.equal(minutesFromTime('23:30:00'), 1410)
  assert.equal(timeFromMinutes(1110), '18:30')
})
