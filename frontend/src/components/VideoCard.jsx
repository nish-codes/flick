import { useNavigate } from 'react-router-dom'

export function fmt(s) {
  if (!s) return ''
  const m = Math.floor(s / 60), sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function views(n) {
  if (n == null) return ''
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function ago(date) {
  if (!date) return ''
  const d = Math.floor((Date.now() - new Date(date)) / 86400000)
  if (d === 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 7)   return `${d}d ago`
  if (d < 30)  return `${Math.floor(d / 7)}w ago`
  if (d < 365) return `${Math.floor(d / 30)}mo ago`
  return `${Math.floor(d / 365)}y ago`
}

export default function VideoCard({ video, badge }) {
  const navigate = useNavigate()
  const owner = video.ownerInfo || video.owner || {}

  return (
    <div className="video-card" onClick={() => navigate(`/video/${video._id}`)}>
      <div className="video-thumbnail">
        {video.thumbnail
          ? <img src={video.thumbnail} alt={video.title} loading="lazy" />
          : <div style={{ width:'100%', height:'100%', background:'var(--surface)' }} />
        }
        {video.duration && <span className="video-duration">{fmt(video.duration)}</span>}
        {badge && <span className="video-badge">{badge}</span>}
      </div>
      <div className="video-meta">
        <div className="video-title">{video.title}</div>
        <div className="video-sub">
          <strong>{owner.fullName || owner.userName}</strong>
          {' · '}{views(video.views)} views{' · '}{ago(video.createdAt)}
        </div>
      </div>
    </div>
  )
}
