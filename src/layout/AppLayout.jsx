import { useState } from 'react'
import { BarChart3, BookOpen, LayoutDashboard, LogOut, Menu, Sparkles, Target, X } from 'lucide-react'

export const APP_NAVIGATION = [
  { label: '홈', icon: LayoutDashboard },
  { label: '목표 관리', icon: BookOpen },
  { label: '통계', icon: BarChart3 },
]

export default function AppLayout({
  member,
  goals,
  selectedGoalId,
  activeNav,
  onNavigate,
  onSelectGoal,
  onLogout,
  children,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const nickname = member?.nickname ?? '회원'
  const initial = nickname.slice(0, 1) || '?'

  function navigate(label) {
    onNavigate(label)
    setMenuOpen(false)
  }

  return <div className="app-shell common-app-shell">
    <header className="app-header">
      <div className="app-header-inner">
        <button className="mobile-nav-button" type="button" aria-label="메뉴 열기" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
          <Menu size={20} />
        </button>
        <div className="brand common-brand"><span className="brand-mark"><Sparkles size={17} fill="currentColor" /></span>Steady<span className="brand-accent">Teller</span></div>
        <nav className={menuOpen ? 'primary-nav open' : 'primary-nav'} aria-label="주요 메뉴">
          <div className="mobile-nav-head"><strong>메뉴</strong><button type="button" aria-label="메뉴 닫기" onClick={() => setMenuOpen(false)}><X size={20} /></button></div>
          {APP_NAVIGATION.map(({ label, icon: Icon }) => <button type="button" className={activeNav === label ? 'primary-nav-item active' : 'primary-nav-item'} key={label} onClick={() => navigate(label)}><Icon size={18} />{label}</button>)}
          <button type="button" className="primary-nav-item mobile-logout" onClick={onLogout}><LogOut size={18} />로그아웃</button>
        </nav>
        <div className="app-account">
          <button type="button" className="header-logout" onClick={onLogout}><LogOut size={17} />로그아웃</button>
          <div className="header-avatar" aria-label={`${nickname} 프로필`}>{initial}</div>
        </div>
      </div>
    </header>
    {menuOpen && <button className="navigation-scrim" type="button" aria-label="메뉴 닫기" onClick={() => setMenuOpen(false)} />}
    <main className="common-main">
      <header className="page-context">
        <div><span>Workspace</span><strong>{activeNav}</strong></div>
        <label className="goal-context-select"><Target size={15} /><span className="sr-only">현재 학습 목표</span>{goals.length ? <select value={selectedGoalId ?? ''} onChange={event => onSelectGoal(Number(event.target.value))}>{goals.map(goal => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select> : <span>선택한 목표 없음</span>}</label>
      </header>
      <div className="common-content">{children}</div>
    </main>
  </div>
}
