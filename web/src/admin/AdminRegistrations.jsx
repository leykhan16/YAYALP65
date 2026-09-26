import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { exportCsv, exportExcel, exportPdf } from '../exportUtils'
import ExportButtons from './ExportButtons'

const COLUMNS = [
  { key: 'registrationId', label: 'Registration ID' },
  { key: 'fullName', label: 'Full Name' },
  { key: 'gender', label: 'Gender' },
  { key: 'phone', label: 'Phone' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'email', label: 'Email' },
  { key: 'familyName', label: 'Community' },
  { key: 'parish', label: 'Parish' },
  { key: 'area', label: 'Area' },
  { key: 'zone', label: 'Zone' },
  { key: 'postHeld', label: 'Post Held' },
  { key: 'department', label: 'Department' },
  { key: 'attendanceStatus', label: 'Status' },
  { key: 'createdAt', label: 'Registered At' },
]

function findDuplicateIds(rows) {
  const seen = new Map()
  const dupes = new Set()
  rows.forEach((r) => {
    const key = `${r.fullName.trim().toLowerCase()}|${r.phone.trim()}`
    if (seen.has(key)) {
      dupes.add(r.registrationId)
      dupes.add(seen.get(key))
    } else {
      seen.set(key, r.registrationId)
    }
  })
  return dupes
}

export default function AdminRegistrations({ token, onExpired }) {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [families, setFamilies] = useState([])
  const [familyId, setFamilyId] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  useEffect(() => {
    api.getFamilies().then(setFamilies).catch(() => {})
  }, [])

  async function load() {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (familyId) params.set('familyId', familyId)
      const data = await api.adminGet(`/registrations?${params.toString()}`, token)
      setRows(data)
    } catch (err) {
      if (err.message.includes('Session')) onExpired()
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 6000)
    return () => clearInterval(interval)
  }, [token, search, familyId])

  const duplicateIds = useMemo(() => findDuplicateIds(rows), [rows])
  const selectedCommunityName = families.find((f) => f.id === familyId)?.name

  function exportName(base, ext) {
    const suffix = selectedCommunityName ? `-${selectedCommunityName.toLowerCase().replace(/\s+/g, '-')}` : ''
    return `${base}${suffix}.${ext}`
  }

  async function handleDelete(registrationId, fullName) {
    const confirmed = window.confirm(`Delete registration ${registrationId} (${fullName})? This cannot be undone.`)
    if (!confirmed) return
    setActionMsg('')
    try {
      await api.adminDelete(`/registrations/${registrationId}`, token)
      setActionMsg(`Deleted ${registrationId}.`)
      load()
    } catch (err) {
      setActionMsg(err.message)
    }
  }

  return (
    <div>
      <div className="admin-toolbar">
        <input placeholder="Search by name, ID, phone, email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={familyId} onChange={(e) => setFamilyId(e.target.value)} className="community-filter">
          <option value="">All Communities</option>
          {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <ExportButtons
          onCsv={() => exportCsv(exportName('registrations', 'csv'), rows, COLUMNS)}
          onExcel={() => exportExcel(exportName('registrations', 'xlsx'), rows, COLUMNS)}
          onPdf={() => exportPdf(exportName('registrations', 'pdf'), `YAYA65 Registrations${selectedCommunityName ? ' — ' + selectedCommunityName : ''}`, rows, COLUMNS)}
        />
      </div>
      {duplicateIds.size > 0 && (
        <p className="dupe-warning">
          {duplicateIds.size} possible duplicate {duplicateIds.size === 1 ? 'entry' : 'entries'} found (same name + phone) — highlighted below.
        </p>
      )}
      {actionMsg && <p className="manual-msg">{actionMsg}</p>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Photo</th><th>ID</th><th>Name</th><th>Gender</th><th>Phone</th>
              <th>Email</th><th>Community</th><th>Post Held</th><th>Parish/Area/Zone</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.registrationId} className={duplicateIds.has(r.registrationId) ? 'dupe-row' : ''}>
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
                <td><button className="delete-btn" onClick={() => handleDelete(r.registrationId, r.fullName)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="admin-empty">No registrations yet.</p>}
      </div>
    </div>
  )
}
