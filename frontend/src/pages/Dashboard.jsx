import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { views } from '../components/VideoCard'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [stats, setStats] = useState(null)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const [videoFile, setVideoFile] = useState(null)
  const [thumbnail, setThumbnail] = useState(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    Promise.all([api.get('/dashboard/stats'), api.get('/dashboard/videos')])
      .then(([s, v]) => { setStats(s.data.data); setVideos(v.data.data || []) })
      .catch(() => toast('Failed to load studio', 'error'))
      .finally(() => setLoading(false))
  }, [user])

  const uploadToCloudinary = (file, sig, resourceType, onProgress) => {
    return new Promise((resolve, reject) => {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('api_key', sig.apiKey)
      fd.append('timestamp', sig.timestamp)
      fd.append('signature', sig.signature)
      fd.append('folder', sig.folder)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`)
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => {
        const res = JSON.parse(xhr.responseText)
        if (xhr.status === 200) resolve(res)
        else reject(new Error(res.error?.message || 'Cloudinary upload failed'))
      }
      xhr.onerror = () => reject(new Error('Network error during upload'))
      xhr.send(fd)
    })
  }

  const uploadVideo = async e => {
    e.preventDefault()
    if (!form.title || !videoFile || !thumbnail) { toast('Title, video and thumbnail required', 'error'); return }
    setUploading(true)
    try {
      // Step 1: get signatures from backend
      setUploadProgress('Preparing upload…')
      const sigRes = await api.get('/videos/upload-signature')
      const { video: videoSig, thumbnail: thumbSig } = sigRes.data.data

      // Step 2: upload thumbnail directly to Cloudinary
      setUploadProgress('Uploading thumbnail…')
      const thumbResult = await uploadToCloudinary(thumbnail, thumbSig, 'image', () => {})

      // Step 3: upload video directly to Cloudinary with progress
      setUploadProgress('Uploading video… 0%')
      const videoResult = await uploadToCloudinary(videoFile, videoSig, 'video', pct => {
        setUploadProgress(`Uploading video… ${pct}%`)
      })

      // Step 4: tell backend to save the URLs
      setUploadProgress('Publishing…')
      const r = await api.post('/videos/save', {
        title: form.title,
        description: form.description,
        videoFile: videoResult.secure_url,
        thumbnail: thumbResult.secure_url,
        duration: videoResult.duration || 0,
        publicId: videoResult.public_id,
      })

      setVideos(v => [r.data.data, ...v])
      setShowUpload(false)
      setForm({ title: '', description: '' })
      setVideoFile(null)
      setThumbnail(null)
      toast('Video published', 'success')
    } catch (err) {
      toast(err?.response?.data?.message || err?.message || 'Upload failed', 'error')
    } finally {
      setUploading(false)
      setUploadProgress('')
    }
  }

  const togglePublish = async id => {
    try {
      const r = await api.patch(`/videos/toggle/${id}`)
      setVideos(vs => vs.map(v => v._id === id ? { ...v, isPublished: r.data.data.isPublished } : v))
      toast(r.data.data.isPublished ? 'Published' : 'Set to private', 'success')
    } catch { toast('Failed to update', 'error') }
  }

  const deleteVideo = async id => {
    if (!confirm('Delete this video permanently?')) return
    try {
      await api.delete(`/videos/${id}`)
      setVideos(vs => vs.filter(v => v._id !== id))
      toast('Video deleted', 'success')
    } catch { toast('Delete failed', 'error') }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-heading">
        Studio
        <button className="btn btn-primary" onClick={() => setShowUpload(v => !v)}>
          {showUpload ? 'Cancel' : '+ Upload'}
        </button>
      </div>

      {stats && (
        <div className="stats-strip">
          {[
            { label: 'Videos',     value: stats.videoCount   ?? 0 },
            { label: 'Subscribers', value: stats.subscribers  ?? 0 },
            { label: 'Total views', value: views(stats.totalViews) || '0' },
            { label: 'Total likes', value: stats.totalLikes   ?? 0 },
          ].map(s => (
            <div key={s.label} className="stat-cell">
              <div className="stat-cell-label">{s.label}</div>
              <div className="stat-cell-value">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <div className="upload-panel">
          <div className="upload-panel-title">Upload video</div>
          <form onSubmit={uploadVideo}>
            <div className="field">
              <label className="field-label">Title</label>
              <input className="field-input" placeholder="Give your video a great title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="field">
              <label className="field-label">Description</label>
              <textarea className="field-input" rows={3} placeholder="Tell viewers about your video" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical', minHeight: 80 }} />
            </div>
            <div className="field">
              <label className="field-label">Video file</label>
              <label className="file-pick">
                <span>{videoFile ? '✓' : '↑'}</span>
                <span>{videoFile ? videoFile.name : 'Choose video (mp4, mov…)'}</span>
                <input type="file" accept="video/*" style={{ display: 'none' }} onChange={e => setVideoFile(e.target.files[0])} />
              </label>
            </div>
            <div className="field">
              <label className="field-label">Thumbnail</label>
              <label className="file-pick">
                <span>{thumbnail ? '✓' : '↑'}</span>
                <span>{thumbnail ? thumbnail.name : 'Choose thumbnail image'}</span>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setThumbnail(e.target.files[0])} />
              </label>
            </div>
            <button type="submit" className="btn btn-primary" disabled={uploading} style={{ marginTop: 4 }}>
              {uploading ? uploadProgress || 'Uploading…' : 'Publish video'}
            </button>
          </form>
        </div>
      )}

      <div className="section-label">Your videos</div>

      {videos.length === 0 ? (
        <div className="empty">
          <div className="empty-glyph">▭</div>
          <div className="empty-title">No videos yet</div>
          <div className="empty-body">Upload your first video to start building an audience.</div>
        </div>
      ) : (
        <div>
          {videos.map(v => (
            <div key={v._id} className="video-row">
              <div className="video-row-thumb">
                {v.thumbnail && <img src={v.thumbnail} alt={v.title} />}
              </div>
              <div className="video-row-info">
                <div className="video-row-title">{v.title}</div>
                <div className="video-row-meta">{views(v.views)} views</div>
                <span className={`status-pill ${v.isPublished ? 'on' : 'off'}`}>
                  {v.isPublished ? 'Published' : 'Private'}
                </span>
              </div>
              <div className="video-row-actions">
                <button className="btn btn-ghost" onClick={() => togglePublish(v._id)}>
                  {v.isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button className="btn btn-danger" onClick={() => deleteVideo(v._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
