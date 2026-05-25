import { useState } from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import SettingsDrawer from './components/SettingsDrawer.jsx'
import TrainingHome from './pages/TrainingHome.jsx'
import ScheduleList from './pages/scheduled-content/ScheduleList.jsx'
import ScheduleForm from './pages/scheduled-content/ScheduleForm.jsx'
import ScheduleDetail from './pages/scheduled-content/ScheduleDetail.jsx'
import ArticleDetail from './pages/scheduled-content/ArticleDetail.jsx'
import AdminBoard from './pages/admin/AdminBoard.jsx'
import GenerationList from './pages/generate/GenerationList.jsx'
import GenerationNew from './pages/generate/GenerationNew.jsx'
import GenerationDetail from './pages/generate/GenerationDetail.jsx'
import Register from './pages/auth/Register.jsx'
import Login from './pages/auth/Login.jsx'
import VerifyEmail from './pages/auth/VerifyEmail.jsx'
import Profile from './pages/auth/Profile.jsx'
import { AuthProvider } from './lib/useAuth.jsx'

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen">
          <Navbar onOpenSettings={() => setSettingsOpen(true)} />
          <main>
            <Routes>
              <Route path="/" element={<TrainingHome />} />
              <Route path="/scheduled-content" element={<ScheduleList />} />
              <Route path="/scheduled-content/new" element={<ScheduleForm mode="new" />} />
              <Route path="/scheduled-content/:id" element={<ScheduleDetail />} />
              <Route path="/scheduled-content/:id/edit" element={<ScheduleForm mode="edit" />} />
              <Route
                path="/scheduled-content/:id/articles/:articleId"
                element={<ArticleDetail />}
              />
              <Route path="/generate" element={<GenerationList />} />
              <Route path="/generate/new" element={<GenerationNew />} />
              <Route path="/generate/:id" element={<GenerationDetail />} />
              <Route path="/admin/board" element={<AdminBoard />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
