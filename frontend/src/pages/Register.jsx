import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'

export default function Register() {
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', userName: '', email: '', password: '' })
  const [avatar, setAvatar] = useState(null)
  const [cover, setCover] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    if (!avatar) { toast('Avatar is required', 'error'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('avatar', avatar)
      if (cover) fd.append('coverImage', cover)
      await api.post('/users/register', fd)
      toast('Account created — sign in to continue', 'success')
      navigate('/login')
    } catch (err) {
      toast(err?.response?.data?.message || 'Registration failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="mark" />
        Flick
      </div>
      <div className="auth-form">
        <div className="auth-heading">Create account</div>
        <div className="auth-sub">Start sharing your work with the world.</div>

        <form onSubmit={submit}>
          <div className="field">
            <label className="field-label">Full name</label>
            <input className="field-input" value={form.fullName} onChange={set('fullName')} placeholder="Alex Kim" required />
          </div>
          <div className="field">
            <label className="field-label">Username</label>
            <input className="field-input" value={form.userName} onChange={set('userName')} placeholder="alexkim" required />
          </div>
          <div className="field">
            <label className="field-label">Email</label>
            <input type="email" className="field-input" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
          </div>
          <div className="field">
            <label className="field-label">Password</label>
            <input type="password" className="field-input" value={form.password} onChange={set('password')} placeholder="8+ characters" minLength={8} required />
          </div>

          <div className="field">
            <label className="field-label">Avatar *</label>
            <label className="file-pick">
              <span>{avatar ? '✓' : '↑'}</span>
              <span>{avatar ? avatar.name : 'Choose avatar'}</span>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setAvatar(e.target.files[0])} />
            </label>
          </div>

          <div className="field">
            <label className="field-label">Cover image <span style={{ textTransform: 'none', color: 'var(--muted)' }}>optional</span></label>
            <label className="file-pick">
              <span>{cover ? '✓' : '↑'}</span>
              <span>{cover ? cover.name : 'Choose cover image'}</span>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setCover(e.target.files[0])} />
            </label>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Join Flick'}
          </button>
        </form>

        <div className="auth-footer">
          Already a member?{' '}
          <button onClick={() => navigate('/login')}>Sign in</button>
        </div>
      </div>
    </div>
  )
}
