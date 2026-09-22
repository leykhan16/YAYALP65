import { useState } from 'react'
import { api } from './api'
import './CheckIn.css'

export default function CheckIn() {
  const [regId, setRegId] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!regId.trim()) return
    setStatus('loading')
    try {
      const data = await api.checkIn(regId.trim().toUpperCase())
      if (data.alreadyCheckedIn) {
        setStatus('already')
        setMessage(`${data.fullName}, your attendance was already recorded.`)
      } else {
        setStatus('success')
        setMessage(`Welcome, ${data.fullName}! Your attendance has been recorded.`)
      }
    } catch (err) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  function reset() {
    setRegId(''); setStatus('idle'); setMessage('')
  }

  return (
    <div className="checkin-page">
      <div className="checkin-card">
        <h1>On Eagle&rsquo;s Wings</h1>
        <p className="checkin-sub">Convention Check-In</p>

        {status === 'idle' || status === 'loading' ? (
          <form onSubmit={handleSubmit}>
            <label>
              Enter your registration ID
              <input
                value={regId}
                onChange={(e) => setRegId(e.target.value)}
                placeholder="YAYA65-26-000001"
                autoFocus
              />
            </label>
            <button type="submit" className="btn-gold" disabled={status === 'loading'}>
              {status === 'loading' ? 'Checking…' : 'Check In'}
            </button>
          </form>
        ) : (
          <div className={`checkin-result ${status}`}>
            <p>{message}</p>
            <button className="btn-gold" onClick={reset}>Done</button>
          </div>
        )}
      </div>
    </div>
  )
}
