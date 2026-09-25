import { useState } from 'react'
import { api } from './api'
import './CheckIn.css'

export default function CheckOut() {
  const [regId, setRegId] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!regId.trim()) return
    setStatus('loading')
    try {
      const data = await api.checkOut(regId.trim().toUpperCase())
      if (data.alreadyCheckedOut) {
        setStatus('already')
        setMessage(`${data.fullName}, your check-out was already recorded.`)
      } else {
        setStatus('success')
        setMessage(`Thank you, ${data.fullName}! Your check-out has been recorded. Safe journey!`)
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
        <p className="checkin-sub">Convention Check-Out</p>

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
              {status === 'loading' ? 'Checking…' : 'Check Out'}
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
