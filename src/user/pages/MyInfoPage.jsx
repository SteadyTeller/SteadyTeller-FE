import { useEffect, useState } from 'react'
import { Bell, Check, Eye, EyeOff, LockKeyhole, Mail, Save, ShieldCheck, UserRound } from 'lucide-react'
import { memberApi } from '../api/memberApi.js'
import './MyInfoPage.css'

const LEVELS = [
  ['BEGINNER', '입문'],
  ['INTERMEDIATE', '중급'],
  ['ADVANCED', '고급'],
]

export default function MyInfoPage({ member, onMemberUpdated }) {
  const [nickname, setNickname] = useState(member.nickname ?? '')
  const [profile, setProfile] = useState({ defaultLevel: 'BEGINNER', preferredStartTime: '', notificationEnabled: true })
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [saving, setSaving] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    let active = true
    memberApi.getLearningProfile().then(value => {
      if (active) setProfile({ defaultLevel: value.defaultLevel ?? 'BEGINNER', preferredStartTime: value.preferredStartTime?.slice(0, 5) ?? '', notificationEnabled: Boolean(value.notificationEnabled) })
    }).catch(error => active && setMessage({ type: 'error', text: error.message || '학습 설정을 불러오지 못했습니다.' })).finally(() => active && setLoadingProfile(false))
    return () => { active = false }
  }, [])

  async function saveBasic(event) {
    event.preventDefault()
    const value = nickname.trim()
    if (!value || value.length > 50) return setMessage({ type: 'error', text: '닉네임은 1자 이상 50자 이하로 입력해주세요.' })
    setSaving('basic'); setMessage({ type: '', text: '' })
    try {
      await memberApi.updateMember({ nickname: value })
      await onMemberUpdated?.()
      setMessage({ type: 'success', text: '기본 정보를 저장했습니다.' })
    } catch (error) { setMessage({ type: 'error', text: error.message || '정보를 저장하지 못했습니다.' }) }
    finally { setSaving('') }
  }

  async function savePassword(event) {
    event.preventDefault()
    if (!isStrongPassword(password)) return setMessage({ type: 'error', text: '비밀번호는 공백 없이 영문·숫자·특수문자를 포함한 8~64자로 입력해주세요.' })
    if (password !== passwordConfirm) return setMessage({ type: 'error', text: '비밀번호 확인이 일치하지 않습니다.' })
    setSaving('password'); setMessage({ type: '', text: '' })
    try {
      await memberApi.updateMember({ password })
      setPassword(''); setPasswordConfirm('')
      setMessage({ type: 'success', text: '비밀번호를 변경했습니다.' })
    } catch (error) { setMessage({ type: 'error', text: error.message || '비밀번호를 변경하지 못했습니다.' }) }
    finally { setSaving('') }
  }

  async function saveProfile(event) {
    event.preventDefault()
    setSaving('profile'); setMessage({ type: '', text: '' })
    try {
      const value = await memberApi.updateLearningProfile({ defaultLevel: profile.defaultLevel, preferredStartTime: profile.preferredStartTime || null, notificationEnabled: profile.notificationEnabled })
      setProfile({ defaultLevel: value.defaultLevel, preferredStartTime: value.preferredStartTime?.slice(0, 5) ?? '', notificationEnabled: Boolean(value.notificationEnabled) })
      setMessage({ type: 'success', text: '학습 설정을 저장했습니다.' })
    } catch (error) { setMessage({ type: 'error', text: error.message || '학습 설정을 저장하지 못했습니다.' }) }
    finally { setSaving('') }
  }

  return <div className="my-info-page">
    <section className="profile-hero"><div className="profile-avatar"><UserRound size={28} /></div><div><p className="section-eyebrow">MY ACCOUNT</p><h1>{member.nickname}님의 정보</h1><p>계정과 기본 학습 환경을 안전하게 관리하세요.</p></div><span className="verified-badge"><ShieldCheck size={15} />활성 계정</span></section>

    {message.text && <div className={`account-message ${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>{message.type === 'success' && <Check size={15} />}{message.text}<button type="button" onClick={() => setMessage({ type: '', text: '' })}>닫기</button></div>}

    <div className="account-grid">
      <div className="account-main-column">
        <form className="settings-card" onSubmit={saveBasic}><SettingsHeading icon={UserRound} title="기본 정보" description="서비스에 표시되는 회원 정보입니다." /><div className="settings-fields"><label><span>이메일</span><div className="readonly-input"><Mail size={15} /><input value={maskEmail(member.email)} readOnly aria-label="이메일" /></div><small>이메일 주소는 보안을 위해 이 화면에서 변경할 수 없습니다.</small></label><label><span>닉네임</span><input maxLength="50" value={nickname} onChange={event => setNickname(event.target.value)} required /></label></div><SaveButton saving={saving === 'basic'} /></form>

        <form className="settings-card" onSubmit={savePassword}><SettingsHeading icon={LockKeyhole} title="비밀번호 변경" description="다른 서비스와 겹치지 않는 비밀번호를 사용해주세요." /><div className="settings-fields two-column"><label><span>새 비밀번호</span><div className="password-input"><input type={showPassword ? 'text' : 'password'} minLength="8" maxLength="64" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} required /><button type="button" aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label><label><span>비밀번호 확인</span><input type={showPassword ? 'text' : 'password'} minLength="8" maxLength="64" autoComplete="new-password" value={passwordConfirm} onChange={event => setPasswordConfirm(event.target.value)} required /></label></div><p className="password-guide">공백 없이 영문, 숫자, 특수문자를 각각 1개 이상 포함해 8~64자로 입력하세요.</p><SaveButton saving={saving === 'password'} label="비밀번호 변경" /></form>
      </div>

      <form className="settings-card learning-settings" onSubmit={saveProfile}><SettingsHeading icon={Bell} title="학습 설정" description="기본 학습 환경과 알림 방식을 설정합니다." />{loadingProfile ? <div className="skeleton profile-setting-skeleton" /> : <div className="settings-fields"><label><span>기본 학습 수준</span><select value={profile.defaultLevel} onChange={event => setProfile(current => ({ ...current, defaultLevel: event.target.value }))}>{LEVELS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label><span>선호 학습 시작 시간</span><input type="time" value={profile.preferredStartTime} onChange={event => setProfile(current => ({ ...current, preferredStartTime: event.target.value }))} /></label><label className="toggle-field"><div><span>학습 알림</span><small>예정된 학습 시간을 알려드려요.</small></div><input type="checkbox" checked={profile.notificationEnabled} onChange={event => setProfile(current => ({ ...current, notificationEnabled: event.target.checked }))} /></label></div>}<SaveButton saving={saving === 'profile'} /></form>
    </div>
  </div>
}

function SettingsHeading({ icon: Icon, title, description }) { return <header className="settings-heading"><span><Icon size={17} /></span><div><h2>{title}</h2><p>{description}</p></div></header> }
function SaveButton({ saving, label = '저장하기' }) { return <div className="settings-actions"><button disabled={saving}><Save size={14} />{saving ? '저장 중…' : label}</button></div> }
function isStrongPassword(value) { return value.length >= 8 && value.length <= 64 && !/\s/.test(value) && /[A-Za-z]/.test(value) && /\d/.test(value) && /[^A-Za-z\d]/.test(value) }
function maskEmail(email = '') { const [name, domain] = email.split('@'); if (!domain) return email; const visible = name.slice(0, Math.min(2, name.length)); return `${visible}${'*'.repeat(Math.max(2, name.length - visible.length))}@${domain}` }
