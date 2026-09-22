import { useState } from 'react'
import { api } from '../api'
import AdminOverview from './AdminOverview'
import AdminRegistrations from './AdminRegistrations'
import AdminAttendance from './AdminAttendance'
import AdminFamilies from './AdminFamilies'
import './Admin.css'

const TABS = ['Overview', 'Registrations', 'Attendance', 'Families']

export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem('yaya65_admin_token') || '')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [tab, setTab] = useState('Overview')

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    try {
      const data = await api.adminLogin(password)
      sessionStorage.setItem('yaya65_admin_token', data.token)
      setToken(data.token)
    } catch (err) {
      setLoginError(err.message)
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('yaya65_admin_token')
    setToken('')
  }

  if (!token) {
    return (
      <div className="admin-login-page">
        <form className="admin-login-card" onSubmit={handleLogin}>
          <h1>YAYA65 Admin</h1>
          <p>Sign in to manage registrations and attendance.</p>
          {loginError && <p className="form-error">{loginError}</p>}
          <input type="password" placeholder="Admin password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
          <button className="btn-gold" type="submit">Sign In</button>
        </form>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <h1>YAYA65 Admin</h1>
        <button className="admin-logout" onClick={handleLogout}>Log out</button>
      </header>
      <nav className="admin-tabs">
        {TABS.map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </nav>
      <main className="admin-content">
        {tab === 'Overview' && <AdminOverview token={token} onExpired={handleLogout} />}
        {tab === 'Registrations' && <AdminRegistrations token={token} onExpired={handleLogout} />}
        {tab === 'Attendance' && <AdminAttendance token={token} onExpired={handleLogout} />}
        {tab === 'Families' && <AdminFamilies token={token} onExpired={handleLogout} />}
      </main>
    </div>
  )
}
