import { useState } from 'react'
import { api } from '../api'

export default function AdminBroadcast({ token, onExpired }) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function handleSend(e) {
    e.preventDefault()
    setError('')
    setResult(null)
    if (!subject.trim() || !message.trim()) {
      setError('Please fill in both subject and message.')
      return
    }
    const confirmed = window.confirm(
      'This will send this email to every registrant who has an email address on file. This cannot be undone. Continue?'
    )
    if (!confirmed) return

    setSending(true)
    try {
      const data = await api.adminPost('/broadcast-email', token, { subject, message })
      setResult(data)
    } catch (err) {
      if (err.message.includes('Session')) onExpired()
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="broadcast-wrap">
      <h3>Broadcast Email</h3>
      <p className="broadcast-note">
        Sends to every registrant who provided an email address. Sending is throttled to avoid spam flags,
        so this may take a few minutes for a large list — please don&rsquo;t close this tab while it&rsquo;s running.
      </p>
      {error && <p className="form-error">{error}</p>}
      {result && (
        <p className="manual-msg">
          Sent to {result.sent} of {result.totalRecipients} recipients.
          {result.failed > 0 && ` ${result.failed} failed to send.`}
        </p>
      )}
      <form onSubmit={handleSend} className="broadcast-form">
        <label className="field">
          <span>Subject</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={sending} />
        </label>
        <label className="field">
          <span>Message</span>
          <textarea rows={10} value={message} onChange={(e) => setMessage(e.target.value)} disabled={sending} />
        </label>
        <button className="btn-gold" type="submit" disabled={sending}>
          {sending ? 'Sending…' : 'Send to All Registrants'}
        </button>
      </form>
    </div>
  )
}
