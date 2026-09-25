import { useState } from 'react'
import { LogIn } from 'lucide-react'
import AuthModal from './auth/components/AuthModal.jsx'
import { useAuth } from './auth/hooks/useAuth.js'
import DashboardPage from './dashboard/pages/DashboardPage.jsx'
import AppLayout from './layout/AppLayout.jsx'
import MyLearningPage from './learning/pages/MyLearningPage.jsx'
import LearningManagementPage from './learning-management/pages/LearningManagementPage.jsx'
import RecordsPage from './records/pages/RecordsPage.jsx'
import MyInfoPage from './user/pages/MyInfoPage.jsx'

const pages = {
  대시보드: DashboardPage,
  '내 학습': MyLearningPage,
  '학습 관리': LearningManagementPage,
  기록: RecordsPage,
  '내 정보 관리': MyInfoPage,
}

function LoginRequired({ activeNav, isLoading, onOpenAuth }) {
  return <section className="access-notice" aria-labelledby="access-notice-title">
    <p className="access-notice-kicker">{activeNav}</p>
    <h1 id="access-notice-title">로그인해야 이용할 수 있습니다.</h1>
    <p>{isLoading ? '로그인 상태를 확인하고 있어요.' : '로그인하면 나의 학습 정보와 기능을 이용할 수 있어요.'}</p>
    {!isLoading && <button type="button" onClick={onOpenAuth}><LogIn size={16} />로그인하기</button>}
  </section>
}

export default function App() {
  const [activeNav, setActiveNav] = useState('대시보드')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const auth = useAuth()
  const CurrentPage = pages[activeNav]

  return <>
    <AppLayout
      activeNav={activeNav}
      member={auth.member}
      onNavigate={setActiveNav}
      onOpenAuth={() => setIsAuthModalOpen(true)}
      onLogout={auth.logout}
    >
      {auth.isAuthenticated
        ? <CurrentPage />
        : <LoginRequired activeNav={activeNav} isLoading={auth.isLoading} onOpenAuth={() => setIsAuthModalOpen(true)} />}
    </AppLayout>
    {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} onLogin={auth.login} onSignup={auth.signup} />}
  </>
}
