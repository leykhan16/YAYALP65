import { useEffect, useState } from 'react'
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
  const [history, setHistory] = useState([])
  const [retryingId, setRetryingId] = useState(null)
  const [retryMsg, setRetryMsg] = useState('')

  async function loadHistory() {
    try {
      const data = await api.adminGet('/broadcast-history', token)
      setHistory(data)
    } catch (err) {
      if (err.message.includes('Session')) onExpired()
    }
  }

  useEffect(() => {
    loadHistory()
  }, [token])

  const totalEverSent = history.reduce((sum, h) => sum + h.sent, 0)

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
      loadHistory()
    } catch (err) {
      if (err.message.includes('Session')) onExpired()
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  async function handleRetry(logId, failedCount) {
    const confirmed = window.confirm(`Retry sending to the ${failedCount} recipient(s) who failed in this broadcast?`)
    if (!confirmed) return
    setRetryMsg('')
    setRetryingId(logId)
    try {
      const data = await api.adminPost(`/broadcast-email/retry/${logId}`, token, {})
      setRetryMsg(`Retry complete: ${data.sent} sent, ${data.failed} still failed.`)
      loadHistory()
    } catch (err) {
      if (err.message.includes('Session')) onExpired()
      setRetryMsg(err.message)
    } finally {
      setRetryingId(null)
    }
  }

  return (
    <div className="broadcast-wrap">
      <h3>Broadcast Email</h3>
      <p className="broadcast-note">
        Sends to every registrant who provided an email address. Sending is throttled to avoid spam flags,
        so this may take several minutes for a large list — please don&rsquo;t close this tab while it&rsquo;s running.
      </p>
      {error && <p className="form-error">{error}</p>}
      {result && (
        <p className="manual-msg">
          Sent to {result.sent} of {result.totalRecipients} recipients.
          {result.failed > 0 && ` ${result.failed} failed to send — see history below to retry just those.`}
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

      <div className="broadcast-history">
        <h3>Broadcast History</h3>
        <p className="broadcast-note">Total emails sent across all broadcasts: <strong>{totalEverSent}</strong></p>
        {retryMsg && <p className="manual-msg">{retryMsg}</p>}
        {history.length === 0 ? (
          <p className="admin-empty">No broadcasts sent yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Subject</th><th>Sent</th><th>Failed</th><th>Total Recipients</th><th>By</th><th>When</th><th></th></tr></thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td>{h.subject}</td>
                    <td>{h.sent}</td>
                    <td>{h.failed}</td>
                    <td>{h.totalRecipients}</td>
                    <td>{h.adminName}</td>
                    <td>{new Date(h.sentAt).toLocaleString()}</td>
                    <td>
                      {h.failed > 0 && (
                        <button
                          className="resend-btn"
                          onClick={() => handleRetry(h.id, h.failed)}
                          disabled={retryingId === h.id}
                        >
                          {retryingId === h.id ? 'Retrying…' : `Retry ${h.failed} Failed`}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
