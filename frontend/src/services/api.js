import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ajo_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally — kick to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ajo_token')
      localStorage.removeItem('ajo_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
  updateProfile:   (data) => api.patch('/auth/me', data),
  changePassword:  (data) => api.patch('/auth/change-password', data),
}

// ── Groups ────────────────────────────────────────────────────────────────
export const groupsAPI = {
  create:       (data)    => api.post('/groups', data),
  list:         ()        => api.get('/groups'),
  get:          (id)      => api.get(`/groups/${id}`),
  update:       (id, data)=> api.patch(`/groups/${id}`, data),
  delete:       (id)      => api.delete(`/groups/${id}`),
  start:        (id)      => api.post(`/groups/${id}/start`),
  shuffleTurns: (id)      => api.post(`/groups/${id}/shuffle-turns`),
  advanceCycle: (id)      => api.post(`/groups/${id}/advance-cycle`),
  dashboard:    (id)      => api.get(`/groups/${id}/dashboard`),
}

// ── Members ───────────────────────────────────────────────────────────────
export const membersAPI = {
  add:               (groupId, data)      => api.post(`/groups/${groupId}/members`, data),
  list:              (groupId)            => api.get(`/groups/${groupId}/members`),
  update:            (groupId, memberId, data) => api.patch(`/groups/${groupId}/members/${memberId}`, data),
  remove:            (groupId, memberId)  => api.delete(`/groups/${groupId}/members/${memberId}`),
  assignTurn:        (groupId, memberId, data) => api.patch(`/groups/${groupId}/members/${memberId}/turn`, data),
  swapTurns:         (groupId, data)      => api.patch(`/groups/${groupId}/members/swap-turns`, data),
  markAdjustmentPaid:(groupId, memberId)  => api.patch(`/groups/${groupId}/members/${memberId}/adjustment-paid`),
}

// ── Payments ──────────────────────────────────────────────────────────────
export const paymentsAPI = {
  record:       (data)          => api.post('/payments', data),
  listForGroup: (groupId, params) => api.get(`/payments/group/${groupId}`, { params }),
  cycleSummary: (groupId, cycle)  => api.get(`/payments/group/${groupId}/cycle/${cycle}`),
  delete:       (id)            => api.delete(`/payments/${id}`),
}

// ── Notifications ─────────────────────────────────────────────────────────
export const notificationsAPI = {
  listForGroup: (groupId) => api.get(`/notifications/group/${groupId}`),
  remind:       (data)    => api.post('/notifications/remind', data),
  turnNotice:   (data)    => api.post('/notifications/turn-notice', data),
}

export default api
