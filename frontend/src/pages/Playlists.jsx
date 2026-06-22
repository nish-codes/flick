import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Playlists() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    api.get('/playlists/user')
      .then(r => setPlaylists(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const create = async e => {
    e.preventDefault()
    if (!form.name) { toast('Name required', 'error'); return }
    setCreating(true)
    try {
      const r = await api.post('/playlists', form)
      setPlaylists(p => [r.data.data, ...p])
      setForm({ name: '', description: '' })
      setShowForm(false)
      toast('Playlist created', 'success')
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to create playlist', 'error')
    } finally { setCreating(false) }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-heading">
        Playlists
        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ New playlist'}
        </button>
      </div>

      {showForm && (
        <div style={{ border: '1px solid var(--rule)', padding: 24, marginBottom: 32, maxWidth: 440 }}>
          <div className="upload-panel-title">New playlist</div>
          <form onSubmit={create}>
            <div className="field">
              <label className="field-label">Name</label>
              <input className="field-input" placeholder="Playlist name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="field">
              <label className="field-label">Description <span style={{ textTransform: 'none', color: 'var(--muted)' }}>optional</span></label>
              <input className="field-input" placeholder="What's in this playlist?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={creating}>
              {creating ? 'Creating…' : 'Create playlist'}
            </button>
          </form>
        </div>
      )}

      {playlists.length === 0 ? (
        <div className="empty">
          <div className="empty-glyph">≡</div>
          <div className="empty-title">No playlists yet</div>
          <div className="empty-body">Create a playlist to organize your favorite videos.</div>
        </div>
      ) : (
        <div className="playlist-grid">
          {playlists.map(p => (
            <div key={p._id} className="playlist-card" onClick={() => navigate(`/playlist/${p._id}`)}>
              <div className="playlist-thumb">
                {p.thumbnail ? <img src={p.thumbnail} alt={p.name} /> : '▤'}
              </div>
              <div className="playlist-details">
                <div className="playlist-title">{p.name}</div>
                {p.description && <div className="playlist-desc">{p.description}</div>}
                <div className="playlist-count">{p.videoCount ?? 0} videos</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
