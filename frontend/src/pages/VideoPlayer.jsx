import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import VideoCard from '../components/VideoCard'
import { views, ago } from '../components/VideoCard'

function CommentSection({ videoId }) {
  const { user } = useAuth()
  const toast = useToast()
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/comments/${videoId}`)
      .then(r => setComments(r.data?.data?.docs || r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [videoId])

  const submit = async e => {
    e.preventDefault()
    if (!text.trim()) return
    if (!user) { toast('Sign in to comment', 'info'); return }
    try {
      const r = await api.post(`/comments/${videoId}`, { content: text.trim() })
      setComments(c => [r.data.data, ...c])
      setText('')
    } catch { toast('Failed to post comment', 'error') }
  }

  const initials = u => (u?.userName || 'U')[0].toUpperCase()

  return (
    <div>
      <div className="comments-count">{comments.length} Comments</div>
      {user && (
        <form className="add-comment" onSubmit={submit}>
          <div className="avatar" style={{ width: 34, height: 34, fontSize: 14, flexShrink: 0 }}>
            {user.avatar ? <img src={user.avatar} alt="" /> : initials(user)}
          </div>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Add a comment…"
          />
          {text && <button className="btn btn-primary" type="submit" style={{ padding: '6px 14px' }}>Post</button>}
        </form>
      )}
      {loading ? (
        <div className="loading" style={{ padding: 24 }}><div className="spinner" /></div>
      ) : comments.map(c => (
        <div key={c._id} className="comment-item">
          <div className="avatar" style={{ width: 30, height: 30, fontSize: 12, flexShrink: 0 }}>
            {c.owner?.avatar ? <img src={c.owner.avatar} alt="" /> : initials(c.owner)}
          </div>
          <div className="comment-body">
            <div className="comment-who">
              @{c.owner?.userName}
              <span>{ago(c.createdAt)}</span>
            </div>
            <div className="comment-text">{c.content}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function VideoPlayer() {
  const { videoId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()

  const [video, setVideo] = useState(null)
  const [related, setRelated] = useState([])
  const [liked, setLiked] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [descExpanded, setDescExpanded] = useState(false)

  useEffect(() => {
    setLoading(true); setVideo(null)
    api.get(`/videos/${videoId}`)
      .then(r => {
        setVideo(r.data.data)
        return api.get('/videos', { params: { limit: 8, sortBy: 'createdAt', sortType: 'desc' } })
      })
      .then(r => {
        const docs = r.data?.data?.docs || r.data?.data?.videos || []
        setRelated(docs.filter(v => v._id !== videoId))
      })
      .catch(() => toast('Failed to load video', 'error'))
      .finally(() => setLoading(false))
  }, [videoId])

  const toggleLike = async () => {
    if (!user) { toast('Sign in to like videos', 'info'); return }
    try {
      const r = await api.post(`/likes/toggle/video/${videoId}`)
      setLiked(r.data.data.liked)
    } catch { toast('Failed to toggle like', 'error') }
  }

  const toggleSubscribe = async () => {
    if (!user) { toast('Sign in to subscribe', 'info'); return }
    const channelId = video?.owner?._id
    if (!channelId) return
    try {
      const r = await api.post(`/subscriptions/toggle/${channelId}`)
      setSubscribed(r.data.data.subscribed)
      toast(r.data.data.subscribed ? 'Subscribed' : 'Unsubscribed', 'success')
    } catch { toast('Failed to update subscription', 'error') }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>

  if (!video) return (
    <div className="empty">
      <div className="empty-glyph">▭</div>
      <div className="empty-title">Video not found</div>
    </div>
  )

  const owner = video.owner || {}
  const initials = (owner.userName || 'U')[0].toUpperCase()

  return (
    <div className="player-layout">
      <div>
        <div className="video-player-frame">
          <video controls autoPlay src={video.videoFile} poster={video.thumbnail}>
            Your browser does not support video playback.
          </video>
        </div>

        <div className="player-title">{video.title}</div>

        <div className="player-meta-row">
          <div className="player-stat">{views(video.views)} views &middot; {ago(video.createdAt)}</div>
          <div className="action-row">
            <button className={`action-btn ${liked ? 'liked' : ''}`} onClick={toggleLike}>
              {liked ? '♥' : '♡'} {liked ? 'Liked' : 'Like'}
            </button>
            <button className="action-btn" onClick={() => { navigator.clipboard?.writeText(window.location.href); toast('Link copied', 'info') }}>
              ↗ Share
            </button>
          </div>
        </div>

        <div className="channel-strip">
          <div className="channel-ident">
            <div
              className="avatar"
              style={{ width: 40, height: 40, fontSize: 16, cursor: 'pointer' }}
              onClick={() => navigate(`/channel/${owner.userName}`)}
            >
              {owner.avatar ? <img src={owner.avatar} alt="" /> : initials}
            </div>
            <div>
              <div className="channel-text-name" onClick={() => navigate(`/channel/${owner.userName}`)}>
                {owner.fullName || owner.userName}
              </div>
              <div className="channel-text-sub">@{owner.userName}</div>
            </div>
          </div>
          {user?._id !== owner._id && (
            <button className={`btn ${subscribed ? 'btn-ghost' : 'btn-primary'}`} onClick={toggleSubscribe}>
              {subscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          )}
        </div>

        {video.description && (
          <div
            className="description-box"
            style={descExpanded ? {} : { maxHeight: 68, overflow: 'hidden' }}
            onClick={() => setDescExpanded(v => !v)}
          >
            {video.description}
            <div style={{ fontWeight: 600, marginTop: 6, color: 'var(--text)', fontSize: 12 }}>
              {descExpanded ? 'Show less' : 'Show more'}
            </div>
          </div>
        )}

        <CommentSection videoId={videoId} />
      </div>

      <div>
        <div className="up-next-label">Up next</div>
        <div className="related-list">
          {related.map(v => {
            const rOwner = v.ownerInfo || v.owner || {}
            return (
              <div key={v._id} className="related-card" onClick={() => navigate(`/video/${v._id}`)}>
                <div className="related-thumb">
                  {v.thumbnail
                    ? <img src={v.thumbnail} alt={v.title} loading="lazy" />
                    : <div style={{ width: '100%', height: '100%', background: 'var(--surface)' }} />
                  }
                </div>
                <div className="related-info">
                  <div className="related-title">{v.title}</div>
                  <div className="related-by">{rOwner.fullName || rOwner.userName} &middot; {views(v.views)} views</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
