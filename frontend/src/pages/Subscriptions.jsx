import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Subscriptions() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    api.get(`/subscriptions/user/${user._id}`)
      .then(r => setChannels(r.data?.data || []))
      .catch(() => toast('Failed to load subscriptions', 'error'))
      .finally(() => setLoading(false))
  }, [user])

  const unsubscribe = async (channelId) => {
    try {
      await api.post(`/subscriptions/toggle/${channelId}`)
      setChannels(prev => prev.filter(c => c._id !== channelId))
      toast('Unsubscribed', 'info')
    } catch {
      toast('Failed to unsubscribe', 'error')
    }
  }

  if (!user) return (
    <div className="empty">
      <div className="empty-glyph">◎</div>
      <div className="empty-title">Sign in to see your subscriptions</div>
    </div>
  )

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 800, marginBottom: 28 }}>
        Subscriptions
      </h1>

      {channels.length === 0 ? (
        <div className="empty">
          <div className="empty-glyph">◎</div>
          <div className="empty-title">No subscriptions yet</div>
          <div className="empty-body">Channels you subscribe to will appear here.</div>
        </div>
      ) : (
        <div className="subs-list">
          {channels.map(ch => {
            const initials = (ch.fullName || ch.userName || '?')[0].toUpperCase()
            return (
              <div key={ch._id} className="sub-row">
                <div
                  className="avatar"
                  style={{ width: 48, height: 48, fontSize: 18, flexShrink: 0, cursor: 'pointer' }}
                  onClick={() => navigate(`/channel/${ch.userName}`)}
                >
                  {ch.avatar ? <img src={ch.avatar} alt="" /> : initials}
                </div>
                <div className="sub-info" onClick={() => navigate(`/channel/${ch.userName}`)}>
                  <div className="sub-name">{ch.fullName || ch.userName}</div>
                  <div className="sub-handle">@{ch.userName}</div>
                </div>
                <button
                  className="btn btn-ghost"
                  style={{ marginLeft: 'auto', flexShrink: 0 }}
                  onClick={() => unsubscribe(ch._id)}
                >
                  Subscribed
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
