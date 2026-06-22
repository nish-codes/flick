import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import VideoPlayer from './pages/VideoPlayer'
import Channel from './pages/Channel'
import LikedVideos from './pages/LikedVideos'
import Playlists from './pages/Playlists'
import Dashboard from './pages/Dashboard'
import WatchHistory from './pages/WatchHistory'

const NO_NAV = ['/login', '/register']

function Shell() {
  const { pathname } = useLocation()
  const [searchQuery, setSearchQuery] = useState('')

  if (NO_NAV.includes(pathname)) {
    return (
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    )
  }

  return (
    <div className="layout">
      <Navbar onSearch={setSearchQuery} />
      <main>
        <div className="page-area">
          <Routes>
            <Route path="/"                element={<Home searchQuery={searchQuery} />} />
            <Route path="/video/:videoId"  element={<VideoPlayer />} />
            <Route path="/channel/:username" element={<Channel />} />
            <Route path="/liked"           element={<LikedVideos />} />
            <Route path="/playlists"       element={<Playlists />} />
            <Route path="/dashboard"       element={<Dashboard />} />
            <Route path="/history"         element={<WatchHistory />} />
            <Route path="*" element={
              <div className="empty">
                <div className="empty-glyph">404</div>
                <div className="empty-title">Page not found</div>
                <div className="empty-body">The page you're looking for doesn't exist.</div>
              </div>
            } />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Shell />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
