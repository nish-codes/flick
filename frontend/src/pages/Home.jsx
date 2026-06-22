import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import VideoCard from '../components/VideoCard'

export default function Home({ searchQuery }) {
  const [searchParams] = useSearchParams()
  const isTrending = searchParams.get('sort') === 'views'
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const fetch = async (q, pg, reset) => {
    setLoading(true)
    try {
      const res = await api.get('/videos', {
        params: { page: pg, limit: 16, sortBy: isTrending ? 'views' : 'createdAt', sortType: 'desc', ...(q ? { query: q } : {}) }
      })
      const data = res.data?.data
      const docs = data?.docs || data?.videos || (Array.isArray(data) ? data : [])
      if (reset) setVideos(docs); else setVideos(v => [...v, ...docs])
      setHasMore(data?.hasNextPage || false)
    } catch {
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { setPage(1); fetch(searchQuery, 1, true) }, [searchQuery, isTrending])

  const loadMore = () => { const next = page + 1; setPage(next); fetch(searchQuery, next, false) }

  if (loading && videos.length === 0) return (
    <div className="loading"><div className="spinner" /></div>
  )

  return (
    <div>
      {isTrending && <div className="page-heading">Trending</div>}
      {searchQuery && (
        <div className="page-heading">Results for &ldquo;{searchQuery}&rdquo;</div>
      )}

      {videos.length === 0 ? (
        <div className="empty">
          <div className="empty-glyph">▭</div>
          <div className="empty-title">{searchQuery ? 'No results found' : 'Nothing here yet'}</div>
          <div className="empty-body">
            {searchQuery ? `No videos match "${searchQuery}".` : 'Upload your first video from the Studio.'}
          </div>
        </div>
      ) : (
        <>
          <div className="video-grid">
            {videos.map((v, i) => (
              <VideoCard key={v._id} video={v} badge={isTrending && i < 3 ? `#${i + 1}` : null} />
            ))}
          </div>
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 36 }}>
              <button className="btn btn-ghost" onClick={loadMore} disabled={loading}>
                {loading ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
