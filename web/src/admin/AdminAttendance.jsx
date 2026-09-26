import { useEffect, useState } from 'react'
import { api } from '../api'
import { exportCsv, exportExcel, exportPdf } from '../exportUtils'
import ExportButtons from './ExportButtons'

const COLUMNS = [
  { key: 'registrationId', label: 'Registration ID' },
  { key: 'fullName', label: 'Full Name' },
  { key: 'familyName', label: 'Community' },
  { key: 'checkedInAt', label: 'Checked In' },
  { key: 'manual', label: 'Manual' },
  { key: 'checkedOutAt', label: 'Checked Out' },
]

export default function AdminAttendance({ token, onExpired }) {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [families, setFamilies] = useState([])
  const [familyId, setFamilyId] = useState('')
  const [manualId, setManualId] = useState('')
  const [manualMsg, setManualMsg] = useState('')
  const [checkoutId, setCheckoutId] = useState('')
  const [checkoutMsg, setCheckoutMsg] = useState('')

  useEffect(() => {
    api.getFamilies().then(setFamilies).catch(() => {})
  }, [])

  async function load() {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (familyId) params.set('familyId', familyId)
      const data = await api.adminGet(`/attendance?${params.toString()}`, token)
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

  async function handleManual(e) {
    e.preventDefault()
    setManualMsg('')
    try {
      const data = await api.adminPost('/attendance/manual', token, { registrationId: manualId.trim().toUpperCase() })
      setManualMsg(data.alreadyCheckedIn ? `${data.fullName} was already checked in.` : `${data.fullName} marked present.`)
      setManualId('')
      load()
    } catch (err) {
      setManualMsg(err.message)
    }
  }

  async function handleCheckout(e) {
    e.preventDefault()
    setCheckoutMsg('')
    try {
      const data = await api.adminPost('/attendance/manual-checkout', token, { registrationId: checkoutId.trim().toUpperCase() })
      setCheckoutMsg(data.alreadyCheckedOut ? `${data.fullName} was already checked out.` : `${data.fullName} marked checked out.`)
      setCheckoutId('')
      load()
    } catch (err) {
      setCheckoutMsg(err.message)
    }
  }

  const selectedCommunityName = families.find((f) => f.id === familyId)?.name
  function exportName(base, ext) {
    const suffix = selectedCommunityName ? `-${selectedCommunityName.toLowerCase().replace(/\s+/g, '-')}` : ''
    return `${base}${suffix}.${ext}`
  }

  const exportRows = rows.map((r) => ({
    ...r,
    manual: r.manual ? 'Manual (admin)' : 'Self check-in',
    checkedOutAt: r.checkedOutAt ? r.checkedOutAt : 'Still onsite',
  }))

  return (
    <div>
      <form className="admin-manual-form" onSubmit={handleManual}>
        <input placeholder="Manual check-in — registration ID" value={manualId} onChange={(e) => setManualId(e.target.value)} />
        <button className="btn-gold" type="submit">Mark Present</button>
      </form>
      {manualMsg && <p className="manual-msg">{manualMsg}</p>}

      <form className="admin-manual-form" onSubmit={handleCheckout}>
        <input placeholder="Manual check-out — registration ID" value={checkoutId} onChange={(e) => setCheckoutId(e.target.value)} />
        <button className="btn-gold checkout-btn" type="submit">Mark Checked Out</button>
      </form>
      {checkoutMsg && <p className="manual-msg">{checkoutMsg}</p>}

      <div className="admin-toolbar">
        <input placeholder="Search checked-in participants…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={familyId} onChange={(e) => setFamilyId(e.target.value)} className="community-filter">
          <option value="">All Communities</option>
          {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <ExportButtons
          onCsv={() => exportCsv(exportName('attendance', 'csv'), exportRows, COLUMNS)}
          onExcel={() => exportExcel(exportName('attendance', 'xlsx'), exportRows, COLUMNS)}
          onPdf={() => exportPdf(exportName('attendance', 'pdf'), `YAYA65 Attendance${selectedCommunityName ? ' — ' + selectedCommunityName : ''}`, exportRows, COLUMNS)}
        />
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>ID</th><th>Name</th><th>Community</th><th>Checked In</th><th>Method</th><th>Checked Out</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.registrationId}>
                <td>{r.registrationId}</td>
                <td>{r.fullName}</td>
                <td>{r.familyName}</td>
                <td>{new Date(r.checkedInAt).toLocaleString()}</td>
                <td>{r.manual ? 'Manual (admin)' : 'Self check-in'}</td>
                <td>{r.checkedOutAt ? new Date(r.checkedOutAt).toLocaleString() : <span className="badge not-present">still onsite</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="admin-empty">No check-ins yet.</p>}
      </div>
    </div>
  )
}
