import test from 'node:test'
import assert from 'node:assert/strict'
import { AUTH_EXPIRED_EVENT, request } from './api.js'

function createStorage() {
  const values = new Map()
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  }
}

test('401 응답이면 저장된 토큰을 제거하고 인증 만료 이벤트를 보낸다', async () => {
  globalThis.localStorage = createStorage()
  globalThis.localStorage.setItem('steadyTeller.accessToken', 'expired-token')
  globalThis.window = new EventTarget()
  globalThis.fetch = async () => new Response(
    JSON.stringify({ success: false, message: '인증이 만료되었습니다.' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } },
  )

  let expired = false
  window.addEventListener(AUTH_EXPIRED_EVENT, () => { expired = true })

  await assert.rejects(request('/api/v1/members/me'), /인증이 만료되었습니다/)
  assert.equal(localStorage.getItem('steadyTeller.accessToken'), null)
  assert.equal(expired, true)
})

test('로그인 상태에서는 Bearer 토큰을 요청 헤더에 포함한다', async () => {
  globalThis.localStorage = createStorage()
  globalThis.localStorage.setItem('steadyTeller.accessToken', 'valid-token')
  globalThis.window = new EventTarget()
  let authorization
  globalThis.fetch = async (_url, options) => {
    authorization = options.headers.Authorization
    return new Response(JSON.stringify({ success: true, data: { id: 1 } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const result = await request('/api/v1/members/me')

  assert.equal(authorization, 'Bearer valid-token')
  assert.deepEqual(result, { id: 1 })
})
