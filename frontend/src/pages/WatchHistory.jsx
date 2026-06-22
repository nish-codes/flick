import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import VideoCard from '../components/VideoCard'
import { useAuth } from '../context/AuthContext'

export default function WatchHistory() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    api.get('/users/watch-history')
      .then(r => setVideos(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-heading">Watch history</div>
      {videos.length === 0 ? (
        <div className="empty">
          <div className="empty-glyph">○</div>
          <div className="empty-title">No watch history</div>
          <div className="empty-body">Videos you watch will appear here.</div>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map(v => <VideoCard key={v._id} video={v} />)}
        </div>
      )}
    </div>
  )
}
