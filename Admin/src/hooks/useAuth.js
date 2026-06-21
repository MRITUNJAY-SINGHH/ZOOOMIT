import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuthContext } from '../context/useAuthContext'
import api from '../utils/api'
import { toast } from 'react-hot-toast'

export const useAuth = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const { login: contextLogin, logout: contextLogout, isAuthenticated } = useAuthContext()

  const login = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      
      const res = await api.post('/auth/login', { email, password })
      
      // res.data contains the user object including token from the backend
      contextLogin(res.data, res.data.token)
      
      toast.success('Successfully logged in!')
      navigate('/', { replace: true })
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Login failed'
      setError(errMsg)
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    contextLogout()
    navigate('/auth/sign-in', { replace: true })
  }

  return {
    login,
    logout,
    isAuthenticated,
    loading,
    error,
  }
}
