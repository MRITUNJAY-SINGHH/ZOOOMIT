import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'
import { Button, Form, FormCheck, FormControl, FormLabel, InputGroup } from 'react-bootstrap'
import { Link } from 'react-router'
import { Icon } from '@/components/common/LucideIcon'

const LoginForm = () => {
  const { login, loading, error } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    email: 'admin@example.com',
    password: 'password',
  })
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    await login(form.email, form.password)
  }
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <FormLabel>
          Email address <span className="text-danger">*</span>
        </FormLabel>
        <FormControl type="email" placeholder="you@example.com" value={form.email} required onChange={handleChange} />
      </div>
      <div className="mb-3">
        <FormLabel>
          Password <span className="text-danger">*</span>
        </FormLabel>
        <div className="position-relative">
          <FormControl name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.password} required onChange={handleChange} style={{ paddingRight: '40px' }} />
          <span 
            className="position-absolute top-50 translate-middle-y" 
            style={{ right: '12px', cursor: 'pointer', color: 'var(--bs-gray-500)' }} 
            onClick={() => setShowPassword(!showPassword)}
          >
            <Icon icon={showPassword ? "lucide:eye-off" : "lucide:eye"} width={18} />
          </span>
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <FormCheck>
          <Form.Check.Input className="form-check-input-light fs-14" type="checkbox" id="rememberMe" />
          <Form.Check.Label htmlFor="rememberMe">Keep me signed in</Form.Check.Label>
        </FormCheck>
        <Link to="/auth/reset-pass" className="text-decoration-underline link-offset-3 text-muted">
          Forgot Password?
        </Link>
      </div>
      {error && <p className="text-danger">{error}</p>}
      <div className="d-grid">
        <Button variant="primary" type="submit" className="fw-semibold py-2 d-flex align-items-center justify-content-center" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </div>
    </form>
  )
}
export default LoginForm
