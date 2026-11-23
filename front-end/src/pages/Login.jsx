
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import TextField from '../components/TextField'
import Button from '../components/Button'
import { login } from '../api/auth'

function validateUsernameOrEmail(value) {
  if (!value.trim()) return 'Enter your username or email.'
  return ''
}

function validatePassword(value) {
  if (!value) return 'Enter your password.'
  return ''
}

export default function Login() {
  const navigate = useNavigate()
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [touched, setTouched] = useState({
    usernameOrEmail: false,
    password: false,
  })

  const usernameError = touched.usernameOrEmail
    ? validateUsernameOrEmail(usernameOrEmail)
    : ''

  const passwordError = touched.password
    ? validatePassword(password)
    : ''

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    setTouched({
      usernameOrEmail: true,
      password: true,
    })

    if (
      validateUsernameOrEmail(usernameOrEmail) ||
      validatePassword(password)
    ) {
      return
    }

    setSubmitting(true)
    try {
      await login(usernameOrEmail.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      // e.g. "Wrong email or password."
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[27.5rem] flex-col bg-background px-5 py-10 text-ink">
      {/* Logo */}
      <h1 className="text-2xl font-bold tracking-tight">Later?</h1>

      {/* Welcome message */}
      <section className="mt-20">
        <h2 className="text-4xl leading-tight font-bold tracking-tight">
          Welcome back.
        </h2>
        <p className="mt-2 text-base leading-relaxed text-muted">
          Your friends saved 6 new places since you left.
        </p>
      </section>

      {/* Login form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-8 flex flex-col gap-6"
      >
        <TextField
          label="Username or email"
          value={usernameOrEmail}
          onChange={(event) => setUsernameOrEmail(event.target.value)}
          onBlur={() =>
            setTouched((current) => ({ ...current, usernameOrEmail: true }))
          }
          error={usernameError}
          autoComplete="username"
        />

        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onBlur={() =>
            setTouched((current) => ({ ...current, password: true }))
          }
          error={passwordError}
          autoComplete="current-password"
        />
        
        {formError && (
            <p role="alert" className="text-sm text-red-600">
            {formError}
            </p>
        )}


        {/* Forgot password */}
        <div className="-mt-3 flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-brand hover:text-brand-dark"
          >
            Forgot password?
          </Link>
        </div>

        {/* Login button */}
        <Button type="submit" className="mt-4 w-full" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      {/* Signup link */}
      <p className="mt-8 text-center text-sm text-ink">
        New here?{' '}
        <Link
          to="/signup"
          className="font-bold text-brand hover:text-brand-dark"
        >
          Create an account
        </Link>
      </p>
    </main>
  )
}
