import { create } from 'zustand'
import { authAPI } from '../services/api'

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('ajo_user') || 'null'),
  token: localStorage.getItem('ajo_token') || null,
  loading: false,
  error: null,

  login: async (credentials) => {
    set({ loading: true, error: null })
    try {
      const { data } = await authAPI.login(credentials)
      localStorage.setItem('ajo_token', data.token)
      localStorage.setItem('ajo_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, loading: false })
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed'
      set({ error: msg, loading: false })
      return { success: false, message: msg }
    }
  },

  register: async (data) => {
    set({ loading: true, error: null })
    try {
      const { data: res } = await authAPI.register(data)
      localStorage.setItem('ajo_token', res.token)
      localStorage.setItem('ajo_user', JSON.stringify(res.user))
      set({ user: res.user, token: res.token, loading: false })
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      set({ error: msg, loading: false })
      return { success: false, message: msg }
    }
  },

  logout: () => {
    localStorage.removeItem('ajo_token')
    localStorage.removeItem('ajo_user')
    set({ user: null, token: null })
  },

  updateUser: (user) => {
    localStorage.setItem('ajo_user', JSON.stringify(user))
    set({ user })
  },

  isAuthenticated: () => !!get().token,
}))

export default useAuthStore
