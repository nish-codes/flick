import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true
})

// Only retry once with a refreshed token; never auto-redirect (causes infinite loops)
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        await axios.post('/api/v1/users/refresh-token', {}, { withCredentials: true })
        return api(original)
      } catch {
        // Token refresh failed — just reject, let components handle it
        return Promise.reject(err)
      }
    }
    return Promise.reject(err)
  }
)

export default api
