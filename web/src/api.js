const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Something went wrong.')
  return data
}

function toFormData(payload, file) {
  const fd = new FormData()
  Object.entries(payload).forEach(([key, value]) => fd.append(key, value ?? ''))
  if (file) fd.append('passport', file)
  return fd
}

export const api = {
  getFamilies: () => request('/api/families', { headers: { 'Content-Type': 'application/json' } }),
  register: (payload, passportFile) =>
    request('/api/registrations', { method: 'POST', body: toFormData(payload, passportFile) }),
  checkIn: (registrationId) =>
    request('/api/attendance/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationId }),
    }),
  adminLogin: (password) =>
    request('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }),
  adminGet: (path, token) => request(`/api/admin${path}`, { headers: { Authorization: `Bearer ${token}` } }),
  adminPost: (path, token, body) =>
    request(`/api/admin${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),
  adminDelete: (path, token) =>
    request(`/api/admin${path}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
}
