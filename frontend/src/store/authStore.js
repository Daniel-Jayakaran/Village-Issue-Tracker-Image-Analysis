import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import api from '../utils/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login
      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/login', { email, password })
          const { user, token } = response.data.data
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
          
          // Set token for future requests
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          return { success: true, user }
        } catch (error) {
          const message = error.response?.data?.message || 'Login failed'
          set({ isLoading: false, error: message })
          return { success: false, error: message }
        }
      },

      // Register
      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/register', userData)
          const { user, token } = response.data.data
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
          
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          return { success: true, user }
        } catch (error) {
          const message = error.response?.data?.message || 'Registration failed'
          set({ isLoading: false, error: message })
          return { success: false, error: message }
        }
      },

      // Logout
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        })
        delete api.defaults.headers.common['Authorization']
      },

      // Restore session
      restoreSession: () => {
        const token = get().token
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        }
      },

      // Check if user has role
      hasRole: (role) => {
        const user = get().user
        return user?.role === role
      },

      // Update user data
      setUser: (userData) => set((state) => ({ user: { ...state.user, ...userData } })),

      // Clear error
      clearError: () => set({ error: null })
    }),
    {
      name: 'vits-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

export default useAuthStore
