import { useState } from 'react'
import { BookOpenCheck, ClipboardList, LayoutDashboard, LogIn, LogOut, Menu, Sparkles, Target, UserRound, X } from 'lucide-react'

export const APP_NAVIGATION = [
  { label: '대시보드', icon: LayoutDashboard },
  { label: '내 학습', icon: BookOpenCheck },
  { label: '학습 관리', icon: Target },
  { label: '기록', icon: ClipboardList },
  { label: '내 정보 관리', icon: UserRound },
]

export default function AppLayout({ activeNav, member, onNavigate, onOpenAuth, onLogout, children }) {
  const [menuOpen, setMenuOpen] = useState(false)

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
          {member && <button type="button" className="primary-nav-item mobile-logout" onClick={onLogout}><LogOut size={18} />로그아웃</button>}
          {!member && <button type="button" className="primary-nav-item mobile-logout" onClick={() => { onOpenAuth(); setMenuOpen(false) }}><LogIn size={18} />로그인</button>}
        </nav>
        <div className="app-account">
          {member ? <>
            <button type="button" className="header-logout" onClick={onLogout}><LogOut size={17} />로그아웃</button>
            <div className="header-avatar" aria-label={`${member.nickname ?? '회원'} 프로필`}>{(member.nickname ?? '회').slice(0, 1)}</div>
          </> : <button type="button" className="header-login" onClick={onOpenAuth}><LogIn size={16} />로그인</button>}
        </div>
      </div>
    </header>
    {menuOpen && <button className="navigation-scrim" type="button" aria-label="메뉴 닫기" onClick={() => setMenuOpen(false)} />}
    <main className="common-main">
      <header className="page-context">
        <div><span>Workspace</span><strong>{activeNav}</strong></div>
      </header>
      <div className="common-content">{children}</div>
    </main>
  </div>
}
