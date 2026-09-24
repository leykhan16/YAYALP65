import { useEffect, useState } from 'react'
import { api } from '../api'
import { downloadCsv } from '../csv'

export default function AdminRegistrations({ token, onExpired }) {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        const data = await api.adminGet(`/registrations?${params.toString()}`, token)
        if (active) setRows(data)
      } catch (err) {
        if (err.message.includes('Session')) onExpired()
      }
    }
    load()
    const interval = setInterval(load, 6000)
    return () => { active = false; clearInterval(interval) }
  }, [token, search])

  function exportCsv() {
    downloadCsv('registrations.csv', rows, [
      'registrationId', 'fullName', 'gender', 'phone', 'whatsapp', 'email', 'familyName',
      'parish', 'area', 'zone', 'postHeld', 'department', 'attendanceStatus', 'createdAt',
    ])
  }

  return (
    <div>
      <div className="admin-toolbar">
        <input placeholder="Search by name, ID, phone, email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn-gold" onClick={exportCsv}>Export CSV</button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Photo</th><th>ID</th><th>Name</th><th>Gender</th><th>Phone</th>
              <th>Email</th><th>Community</th><th>Post Held</th><th>Parish/Area/Zone</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.registrationId}>
                <td>{r.passportUrl ? <img src={r.passportUrl} alt="" className="admin-thumb" /> : '—'}</td>
                <td>{r.registrationId}</td>
                <td>{r.fullName}</td>
                <td>{r.gender}</td>
                <td>{r.phone}</td>
                <td>{r.email}</td>
                <td>{r.familyName}</td>
                <td>{r.postHeld}</td>
                <td>{r.parish} / {r.area} / {r.zone}</td>
                <td><span className={`badge ${r.attendanceStatus}`}>{r.attendanceStatus}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="admin-empty">No registrations yet.</p>}
      </div>
    </div>
  )
}
