const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  if (res.status === 204) return null
  return res.json()
}

// ── Members ──────────────────────────────────────────────────────────────────
export const getMembers = () => request('/members')
export const createMember = (name) =>
  request('/members', { method: 'POST', body: JSON.stringify({ name }) })
export const deleteMember = (id) =>
  request(`/members/${id}`, { method: 'DELETE' })

// ── Daily Expenses ────────────────────────────────────────────────────────────
export const getDailyExpenses = (params = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString()
  return request(`/daily${qs ? '?' + qs : ''}`)
}
export const createDailyExpense = (data) =>
  request('/daily', { method: 'POST', body: JSON.stringify(data) })
export const updateDailyExpense = (id, data) =>
  request(`/daily/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteDailyExpense = (id) =>
  request(`/daily/${id}`, { method: 'DELETE' })

// ── Fixed Expenses ────────────────────────────────────────────────────────────
export const getFixedExpenses = (params = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString()
  return request(`/fixed${qs ? '?' + qs : ''}`)
}
export const createFixedExpense = (data) =>
  request('/fixed', { method: 'POST', body: JSON.stringify(data) })
export const updateFixedExpense = (id, data) =>
  request(`/fixed/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteFixedExpense = (id) =>
  request(`/fixed/${id}`, { method: 'DELETE' })

// ── Shopping Expenses ─────────────────────────────────────────────────────────
export const getShoppingExpenses = (params = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString()
  return request(`/shopping${qs ? '?' + qs : ''}`)
}
export const createShoppingExpense = (data) =>
  request('/shopping', { method: 'POST', body: JSON.stringify(data) })
export const updateShoppingExpense = (id, data) =>
  request(`/shopping/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteShoppingExpense = (id) =>
  request(`/shopping/${id}`, { method: 'DELETE' })

const buildQuery = (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  ).toString()
  return qs ? `?${qs}` : ''
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboard = (month, room) => {
  const qs = buildQuery({ month, room })
  return request(`/dashboard${qs}`)
}

// ── Monthly Report ────────────────────────────────────────────────────────────
export const getMonthlyReport = (room) => {
  const qs = buildQuery({ room })
  return request(`/report/monthly${qs}`)
}

// ── Rooms ─────────────────────────────────────────────────────────────────────
export const getRooms = () => request('/rooms')
export const createRoom = (data) => request('/rooms', { method: 'POST', body: JSON.stringify(data) })
export const updateRoom = (id, data) => request(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteRoom = (id) => request(`/rooms/${id}`, { method: 'DELETE' })

// ── Export ────────────────────────────────────────────────────────────────────
export const downloadExcel = (month, room) => {
  const qs = buildQuery({ month, room })
  window.location.href = `${BASE}/export/excel${qs}`
}

export const clearExpensesByMonth = (month, room) => {
  const qs = buildQuery({ month, room })
  return request(`/expenses${qs}`, { method: 'DELETE' })
}
