import { useState } from 'react'
import { ArrowRight, Sparkles, X } from 'lucide-react'
import './AuthModal.css'

export default function AuthModal({ onClose, onLogin, onSignup }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSignup = mode === 'signup'

  async function submit(event) {
    event.preventDefault()
    setMessage('')
    setIsSubmitting(true)
    try {
      if (isSignup) {
        await onSignup({ email, password, nickname })
        setMode('login')
        setPassword('')
        setMessage('회원가입이 완료됐어요. 로그인해주세요.')
      } else {
        await onLogin({ email, password })
        onClose()
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return <div className="auth-modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" onMouseDown={event => event.stopPropagation()}>
      <button className="auth-modal-close" type="button" aria-label="로그인 창 닫기" onClick={onClose}><X size={18} /></button>
      <div className="auth-modal-brand"><Sparkles size={17} fill="currentColor" />SteadyTeller</div>
      <p className="auth-modal-kicker">YOUR STEADY LEARNING COACH</p>
      <h1 id="auth-modal-title">{isSignup ? '계정을 만들어요' : '다시, 꾸준히 시작해요'}</h1>
      <p className="auth-modal-description">{isSignup ? '학습 여정을 저장할 계정을 만들어보세요.' : '로그인하고 나의 학습 여정을 이어가세요.'}</p>
      <form onSubmit={submit}>
        {isSignup && <label>닉네임<input required value={nickname} onChange={event => setNickname(event.target.value)} /></label>}
        <label>이메일<input type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <label>비밀번호<input type="password" minLength="8" required value={password} onChange={event => setPassword(event.target.value)} placeholder="8자 이상 입력해주세요" /></label>
        {message && <p className={message.includes('완료') ? 'auth-modal-message success' : 'auth-modal-message'}>{message}</p>}
        <button className="auth-modal-submit" disabled={isSubmitting}>{isSubmitting ? '처리 중...' : isSignup ? '회원가입하기' : '로그인하기'} <ArrowRight size={16} /></button>
      </form>
      <button className="auth-modal-switch" type="button" onClick={() => { setMode(isSignup ? 'login' : 'signup'); setMessage('') }}>
        {isSignup ? '이미 계정이 있나요? 로그인' : '처음 오셨나요? 회원가입'}
      </button>
    </section>
  </div>
}
