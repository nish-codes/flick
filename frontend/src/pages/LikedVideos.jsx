import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import VideoCard from '../components/VideoCard'
import { useAuth } from '../context/AuthContext'

export default function LikedVideos() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    api.get('/likes/videos')
      .then(r => setVideos(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-heading">Liked videos</div>
      {videos.length === 0 ? (
        <div className="empty">
          <div className="empty-glyph">♡</div>
          <div className="empty-title">No liked videos</div>
          <div className="empty-body">Videos you like will appear here.</div>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map(v => <VideoCard key={v._id} video={v} />)}
        </div>
      )}
    </div>
  )
}
