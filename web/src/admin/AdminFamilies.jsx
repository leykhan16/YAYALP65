import { useEffect, useState } from 'react'
import { api } from '../api'

export default function AdminFamilies({ token, onExpired }) {
  const [families, setFamilies] = useState([])
  const [selected, setSelected] = useState(null)
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

  async function openFamily(id) {
    setSelected(id)
    const data = await api.adminGet(`/families/${id}`, token)
    setMembers(data.members)
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

  return (
    <div>
      <form className="admin-manual-form" onSubmit={handleAdd}>
        <input placeholder="New community name" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <input placeholder="Code (optional)" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
        <button className="btn-gold" type="submit">Add Family</button>
      </form>
      {addMsg && <p className="manual-msg">{addMsg}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Community</th><th>Registered</th><th>Present</th><th>Not Present</th><th>Rate</th></tr></thead>
          <tbody>
            {families.map((f) => (
              <tr key={f.id} className="clickable" onClick={() => openFamily(f.id)}>
                <td>{f.name}</td><td>{f.registered}</td><td>{f.present}</td><td>{f.notPresent}</td><td>{f.rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="family-drilldown">
          <h3>Members</h3>
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
