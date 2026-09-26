import { useEffect, useState } from 'react'
import { api } from '../api'
import { exportCsv, exportExcel, exportPdf } from '../exportUtils'
import ExportButtons from './ExportButtons'

const OVERVIEW_COLUMNS = [
  { key: 'name', label: 'Community' },
  { key: 'registered', label: 'Registered' },
  { key: 'present', label: 'Present' },
  { key: 'notPresent', label: 'Not Present' },
  { key: 'rate', label: 'Attendance Rate (%)' },
]

const MEMBER_COLUMNS = [
  { key: 'registrationId', label: 'Registration ID' },
  { key: 'fullName', label: 'Full Name' },
  { key: 'gender', label: 'Gender' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'attendanceStatus', label: 'Status' },
]

export default function AdminFamilies({ token, onExpired }) {
  const [families, setFamilies] = useState([])
  const [selected, setSelected] = useState(null)
  const [selectedName, setSelectedName] = useState('')
  const [members, setMembers] = useState([])
  const [newName, setNewName] = useState('')
  const [newCode, setNewCode] = useState('')
  const [addMsg, setAddMsg] = useState('')

  async function load() {
    try {
      const data = await api.adminGet('/families', token)
      setFamilies(data)
    } catch (err) {
      if (err.message.includes('Session')) onExpired()
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 6000)
    return () => clearInterval(interval)
  }, [token])

  async function openFamily(id, name) {
    setSelected(id)
    setSelectedName(name)
    const data = await api.adminGet(`/families/${id}`, token)
    const sorted = [...data.members].sort((a, b) =>
      a.registrationId.localeCompare(b.registrationId, undefined, { numeric: true })
    )
    setMembers(sorted)
  }

  async function handleAdd(e) {
    e.preventDefault()
    setAddMsg('')
    try {
      await api.adminPost('/families', token, { name: newName, code: newCode })
      setNewName(''); setNewCode('')
      setAddMsg('Community added.')
      load()
    } catch (err) {
      setAddMsg(err.message)
    }
  }

  const slug = (selectedName || 'community').toLowerCase().replace(/\s+/g, '-')

  return (
    <div>
      <form className="admin-manual-form" onSubmit={handleAdd}>
        <input placeholder="New community name" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <input placeholder="Code (optional)" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
        <button className="btn-gold" type="submit">Add Community</button>
      </form>
      {addMsg && <p className="manual-msg">{addMsg}</p>}

      <div className="admin-toolbar">
        <span />
        <ExportButtons
          onCsv={() => exportCsv('communities.csv', families, OVERVIEW_COLUMNS)}
          onExcel={() => exportExcel('communities.xlsx', families, OVERVIEW_COLUMNS)}
          onPdf={() => exportPdf('communities.pdf', 'YAYA65 Communities Overview', families, OVERVIEW_COLUMNS)}
        />
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Community</th><th>Registered</th><th>Present</th><th>Not Present</th><th>Rate</th></tr></thead>
          <tbody>
            {families.map((f) => (
              <tr key={f.id} className="clickable" onClick={() => openFamily(f.id, f.name)}>
                <td>{f.name}</td><td>{f.registered}</td><td>{f.present}</td><td>{f.notPresent}</td><td>{f.rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="family-drilldown">
          <div className="admin-toolbar">
            <h3>{selectedName} — Members</h3>
            <ExportButtons
              onCsv={() => exportCsv(`${slug}-members.csv`, members, MEMBER_COLUMNS)}
              onExcel={() => exportExcel(`${slug}-members.xlsx`, members, MEMBER_COLUMNS)}
              onPdf={() => exportPdf(`${slug}-members.pdf`, `${selectedName} — Members`, members, MEMBER_COLUMNS)}
            />
          </div>
          <ul className="admin-list">
            {members.map((m) => (
              <li key={m.registrationId}>
                <strong>{m.fullName}</strong> — {m.registrationId} — <span className={`badge ${m.attendanceStatus}`}>{m.attendanceStatus}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
