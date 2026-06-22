import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import VideoCard from '../components/VideoCard'

export default function Channel() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()

  const [channel, setChannel] = useState(null)
  const [videos, setVideos] = useState([])
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/users/channel/${username}`)
      .then(r => {
        const ch = r.data.data
        setChannel(ch)
        setSubscribed(ch.isSubscribed)
        return api.get('/videos', { params: { userId: ch._id, limit: 24 } })
      })
      .then(r => {
        const data = r.data?.data
        setVideos(data?.docs || data?.videos || (Array.isArray(data) ? data : []))
      })
      .catch(() => toast('Channel not found', 'error'))
      .finally(() => setLoading(false))
  }, [username])

  const toggleSubscribe = async () => {
    if (!user) { toast('Sign in to subscribe', 'info'); return }
    try {
      const r = await api.post(`/subscriptions/toggle/${channel._id}`)
      setSubscribed(r.data.data.subscribed)
      setChannel(c => ({ ...c, subscriberCount: c.subscriberCount + (r.data.data.subscribed ? 1 : -1) }))
      toast(r.data.data.subscribed ? 'Subscribed' : 'Unsubscribed', 'success')
    } catch { toast('Failed to update subscription', 'error') }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>
  if (!channel) return (
    <div className="empty">
      <div className="empty-glyph">?</div>
      <div className="empty-title">Channel not found</div>
    </div>
  )

  const initials = (channel.userName || 'U')[0].toUpperCase()

  return (
    <div style={{ margin: '-40px -32px 0' }}>
      <div className="channel-banner">
        {channel.coverImage
          ? <img src={channel.coverImage} alt="cover" />
          : <div className="channel-banner-placeholder" />
        }
      </div>

      <div style={{ padding: '0 32px 40px' }}>
        <div className="channel-identity">
          <div className="channel-big-avatar">
            {channel.avatar ? <img src={channel.avatar} alt={channel.userName} /> : initials}
          </div>
          <div className="channel-id-text">
            <div className="channel-display-name">{channel.fullName}</div>
            <div className="channel-handle">
              @{channel.userName} &middot; {channel.subscriberCount ?? 0} subscribers &middot; {videos.length} videos
            </div>
          </div>
          {user?._id !== channel._id && (
            <button className={`btn ${subscribed ? 'btn-ghost' : 'btn-primary'}`} onClick={toggleSubscribe}>
              {subscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          )}
        </div>

        {videos.length === 0 ? (
          <div className="empty">
            <div className="empty-glyph">▭</div>
            <div className="empty-title">No videos yet</div>
            <div className="empty-body">This channel hasn't uploaded anything.</div>
          </div>
        ) : (
          <div className="video-grid">
            {videos.map(v => <VideoCard key={v._id} video={v} />)}
          </div>
        )}
      </div>
    </div>
  )
}
