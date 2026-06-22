import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Navbar({ onSearch }) {
  const { user, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const close = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const handleSearch = e => {
    e.preventDefault()
    if (query.trim()) { onSearch(query.trim()); navigate('/') }
  }

  const handleLogout = async () => {
    try { await logout(); toast('Signed out', 'info'); navigate('/') }
    catch { toast('Sign out failed', 'error') }
    setMenuOpen(false)
  }

  const initials = user ? (user.fullName || user.userName || '?')[0].toUpperCase() : ''

  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={() => navigate('/')}>
        <div className="mark" />
        Flick
      </div>

      <div className="nav-links">
        <button className={`nav-link ${pathname === '/' ? 'active' : ''}`} onClick={() => { onSearch(''); navigate('/') }}>
          Home
        </button>
        <button className={`nav-link ${pathname === '/' ? '' : ''}`} onClick={() => navigate('/?sort=views')}>
          Trending
        </button>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <i className="search-icon">⌕</i>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search…"
        />
      </form>

      <div className="nav-spacer" />

      <div className="navbar-actions">
        {user ? (
          <div className="user-menu-wrap" ref={menuRef}>
            <div
              className="avatar"
              style={{ width: 32, height: 32, fontSize: 13 }}
              onClick={() => setMenuOpen(v => !v)}
            >
              {user.avatar ? <img src={user.avatar} alt="" /> : initials}
            </div>
            {menuOpen && (
              <div className="user-dropdown">
                <div className="user-dropdown-header">
                  <div className="user-dropdown-name">{user.fullName}</div>
                  <div className="user-dropdown-handle">@{user.userName}</div>
                </div>
                {[
                  { label: 'Your Channel', path: `/channel/${user.userName}` },
                  { label: 'Studio',       path: '/dashboard' },
                  { label: 'Playlists',    path: '/playlists' },
                  { label: 'Liked videos', path: '/liked' },
                  { label: 'History',      path: '/history' },
                ].map(item => (
                  <button key={item.path} className="user-dropdown-item"
                    onClick={() => { navigate(item.path); setMenuOpen(false) }}>
                    {item.label}
                  </button>
                ))}
                <div className="user-dropdown-divider" />
                <button className="user-dropdown-item danger" onClick={handleLogout}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button className="btn btn-text" onClick={() => navigate('/login')}>Sign in</button>
            <button className="btn btn-primary" onClick={() => navigate('/register')}>Join Flick</button>
          </>
        )}
      </div>
    </nav>
  )
}
