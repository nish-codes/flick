import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const publicItems = [
  { icon: '🏠', label: 'Home',     path: '/' },
  { icon: '🔥', label: 'Trending', path: '/?sort=views' },
]

const authItems = [
  { icon: '❤️', label: 'Liked',   path: '/liked' },
  { icon: '📋', label: 'Playlists', path: '/playlists' },
  { icon: '🎬', label: 'Studio',   path: '/dashboard' },
  { icon: '📺', label: 'History',  path: '/history' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const isActive = path => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path.split('?')[0])

  const Item = ({ icon, label, path }) => (
    <button className={`sidebar-item ${isActive(path) ? 'active' : ''}`} onClick={() => navigate(path)}>
      <span className="icon">{icon}</span> {label}
    </button>
  )

  return (
    <aside className="sidebar">
      <div className="sidebar-logo-sub">Discover</div>
      {publicItems.map(i => <Item key={i.path} {...i} />)}

      {user && (
        <>
          <div className="sidebar-divider" />
          <div className="sidebar-label">Your Space</div>
          {authItems.map(i => <Item key={i.path} {...i} />)}
        </>
      )}
    </aside>
  )
}
