import { useEffect, useState } from 'react'
import { api } from '../api'

export default function AdminOverview({ token, onExpired }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const data = await api.adminGet('/dashboard', token)
        if (active) setStats(data)
      } catch (err) {
        if (err.message.includes('Session')) onExpired()
      }
    }
    load()
    const interval = setInterval(load, 6000)
    return () => { active = false; clearInterval(interval) }
  }, [token])

  if (!stats) return <p>Loading…</p>

  return (
    <div>
      <div className="stats-strip">
        <Stat label="Registrations" value={stats.totalRegistrations} />
        <Stat label="Present" value={stats.totalPresent} />
        <Stat label="Not Present" value={stats.totalNotPresent} />
        <Stat label="Attendance Rate" value={`${stats.attendanceRate}%`} />
        <Stat label="Families" value={stats.totalFamilies} />
      </div>
      <div className="admin-columns">
        <div>
          <h3>Recent Registrations</h3>
          <ul className="admin-list">
            {stats.recentRegistrations.map((r) => (
              <li key={r.registrationId}><strong>{r.fullName}</strong> — {r.registrationId}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Recent Check-Ins</h3>
          <ul className="admin-list">
            {stats.recentCheckIns.map((r) => (
              <li key={r.registrationId}><strong>{r.fullName}</strong> — {new Date(r.checkedInAt).toLocaleTimeString()} {r.manual ? '(manual)' : ''}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
