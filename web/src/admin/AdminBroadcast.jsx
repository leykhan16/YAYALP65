import { useState } from 'react'
import { api } from '../api'

export default function AdminBroadcast({ token, onExpired }) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [testSending, setTestSending] = useState(false)
  const [testMsg, setTestMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function handleTestSend() {
    setTestMsg('')
    setError('')
    if (!testEmail.trim()) { setTestMsg('Enter an email address for the test.'); return }
    if (!subject.trim() || !message.trim()) { setError('Fill in subject and message first.'); return }
    setTestSending(true)
    try {
      await api.adminPost('/broadcast-email/test', token, { email: testEmail, subject, message })
      setTestMsg(`Test email sent to ${testEmail}. Check your inbox before sending to everyone.`)
    } catch (err) {
      if (err.message.includes('Session')) onExpired()
      setTestMsg(err.message)
    } finally {
      setTestSending(false)
    }
  }

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

      <div className="broadcast-form">
        <label className="field">
          <span>Subject</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={sending} />
        </label>
        <label className="field">
          <span>Message</span>
          <textarea rows={10} value={message} onChange={(e) => setMessage(e.target.value)} disabled={sending} />
        </label>

        <div className="test-send-row">
          <input
            type="email"
            placeholder="Your email — send a test copy first"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            disabled={testSending}
          />
          <button type="button" className="btn-gold test-btn" onClick={handleTestSend} disabled={testSending}>
            {testSending ? 'Sending test…' : 'Send Test to Me'}
          </button>
        </div>
        {testMsg && <p className="manual-msg">{testMsg}</p>}

        <button className="btn-gold" onClick={handleSend} disabled={sending}>
          {sending ? 'Sending…' : 'Send to All Registrants'}
        </button>
      </div>
    </div>
  )
}
