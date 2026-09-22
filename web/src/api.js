const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Something went wrong.')
  return data
}

export const api = {
  getFamilies: () => request('/api/families'),
  register: (payload) => request('/api/registrations', { method: 'POST', body: JSON.stringify(payload) }),
  checkIn: (registrationId) => request('/api/attendance/check-in', { method: 'POST', body: JSON.stringify({ registrationId }) }),
  adminLogin: (password) => request('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) }),
  adminGet: (path, token) => request(`/api/admin${path}`, { headers: { Authorization: `Bearer ${token}` } }),
  adminPost: (path, token, body) => request(`/api/admin${path}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) }),
}
