import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.identifier, form.password)
      toast('Welcome back', 'success')
      navigate('/')
    } catch (err) {
      toast(err?.response?.data?.message || 'Sign in failed', 'error')
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
        <div className="auth-heading">Sign in</div>
        <div className="auth-sub">Good to have you back.</div>

        <form onSubmit={submit}>
          <div className="field">
            <label className="field-label">Email or username</label>
            <input type="text" className="field-input" value={form.identifier} onChange={set('identifier')} placeholder="you@example.com or @handle" required autoComplete="username" />
          </div>
          <div className="field">
            <label className="field-label">Password</label>
            <input type="password" className="field-input" value={form.password} onChange={set('password')} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-footer">
          New to Flick?{' '}
          <button onClick={() => navigate('/register')}>Create account</button>
        </div>
      </div>
    </div>
  )
}
