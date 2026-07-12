import { useState, useEffect, useRef, useMemo } from 'react'
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
  const [likesCount, setLikesCount] = useState(0)
  const [subscribed, setSubscribed] = useState(false)
  const [subscribersCount, setSubscribersCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [descExpanded, setDescExpanded] = useState(false)
  const [quality, setQuality] = useState('original')
  const viewedRef = useRef(false)

  // Reset all per-video state immediately when navigating
  useEffect(() => {
    setQuality('original')
    setLiked(false)
    setLikesCount(0)
    setSubscribersCount(0)
    viewedRef.current = false
  }, [videoId])

  const QUALITY_TRANSFORMS = {
    '360p':    'w_640,h_360,c_scale,q_auto',
    '720p':    'w_1280,h_720,c_scale,q_auto',
    'original': 'q_auto',
  }

  const isCloudinary = video?.videoFile?.includes('res.cloudinary.com')

  const currentSrc = useMemo(() => {
    if (!video?.videoFile) return ''
    if (!isCloudinary) return video.videoFile
    const t = QUALITY_TRANSFORMS[quality] || 'q_auto'
    return video.videoFile.replace('/video/upload/', `/video/upload/${t}/`)
  }, [video, quality])

  useEffect(() => {
    setLoading(true); setVideo(null)
    api.get(`/videos/${videoId}`)
      .then(r => {
        const v = r.data.data
        setVideo(v)
        setLiked(v.isLiked || false)
        setLikesCount(v.likesCount || 0)
        setSubscribersCount(v.subscribersCount || 0)
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
      const nowLiked = r.data.data.liked
      setLiked(nowLiked)
      setLikesCount(c => nowLiked ? c + 1 : c - 1)
    } catch { toast('Failed to toggle like', 'error') }
  }

  const toggleSubscribe = async () => {
    if (!user) { toast('Sign in to subscribe', 'info'); return }
    const channelId = video?.owner?._id
    if (!channelId) return
    try {
      const r = await api.post(`/subscriptions/toggle/${channelId}`)
      const nowSub = r.data.data.subscribed
      setSubscribed(nowSub)
      setSubscribersCount(c => nowSub ? c + 1 : c - 1)
      toast(nowSub ? 'Subscribed' : 'Unsubscribed', 'success')
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
          <video
            key={currentSrc}
            controls
            src={currentSrc}
            poster={video.thumbnail}
            preload="metadata"
            style={{ width: '100%', height: '100%', display: 'block', background: '#000' }}
            onPlay={() => {
              if (viewedRef.current) return
              viewedRef.current = true
              api.post(`/videos/${videoId}/view`).catch(() => {})
            }}
          />
        </div>

        <div className="player-title">{video.title}</div>

        {isCloudinary && (
          <div className="quality-row">
            <span className="quality-label">Quality</span>
            {Object.keys(QUALITY_TRANSFORMS).map(q => (
              <button
                key={q}
                className={`quality-btn ${quality === q ? 'active' : ''}`}
                onClick={() => setQuality(q)}
              >{q === 'original' ? 'Original' : q}</button>
            ))}
          </div>
        )}

        <div className="player-meta-row">
          <div className="player-stat">{views(video.views)} views &middot; {ago(video.createdAt)}</div>
          <div className="action-row">
            <button className={`action-btn ${liked ? 'liked' : ''}`} onClick={toggleLike}>
              {liked ? '♥' : '♡'} {likesCount > 0 ? views(likesCount) : ''} {liked ? 'Liked' : 'Like'}
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
              <div className="channel-text-sub">@{owner.userName} &middot; {views(subscribersCount)} subscribers</div>
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
