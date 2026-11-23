import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import TextField from '../components/TextField'
import Button from '../components/Button'
import { signup, checkUsernameAvailable } from '../api/auth'

// Checks a username and returns an error message, or '' if it's fine.
function validateUsername(username) {
  const value = username.trim().toLowerCase()
  if (!value) return 'Pick a username.'
  if (value.length < 3) return 'Use at least 3 characters.'
  if (!/^[a-z0-9_]+$/.test(value)) return 'Use only letters, numbers, and underscores.'
  return ''
}

// Checks an email and returns an error message, or '' if the email is fine.
function validateEmail(email) {
  // trim() removes spaces, so "   " counts as empty
  if (!email.trim()) return 'Enter your email.'
  // The pattern is some text, then @, then some text, then a dot, then some text.
  // No spaces are allowed anywhere. This catches invalid emails like "abc" and "abc@"
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.'
  return ''
}

// Checks a password the same way: returns the first problem found, or '' if it's fine
function validatePassword(password) {
  if (!password) return 'Enter a password.'
  if (password.length < 8) return 'Use at least 8 characters.'
  // /[0-9]/ looks for at least one digit anywhere in the password
  if (!/[0-9]/.test(password)) return 'Include at least one number.'
  return ''
}

export default function Signup() {
  const navigate = useNavigate()

  // What the user has typed so far. Each useState gives a value and a function to change it.
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Tracks whether the user has finished with each field (clicked away or tried to submit)
  const [touched, setTouched] = useState({ username: false, email: false, password: false })
  // The server's message if signup fails, e.g. "That email is already in use."
  const [formError, setFormError] = useState('')
  // Result of the last username check from the server: { name, available }
  const [availability, setAvailability] = useState(null)

  const cleanedUsername = username.trim().toLowerCase()

  // Ask the server whether the username is free, shortly after the user stops typing.
  // Only runs once the username passes the format rules above.
  useEffect(() => {
    if (validateUsername(cleanedUsername)) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailable(cleanedUsername, { signal: controller.signal })
        setAvailability({ name: cleanedUsername, available: result.available })
      } catch {
        // Cancelled or server problem: ignore. The server checks again on submit.
      }
    }, 400)

    // Runs when the username changes again, so old checks never show up late
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [cleanedUsername])

  const formatOk = !validateUsername(username)
  // Only trust a result that is for the username currently in the box
  const checked = availability && availability.name === cleanedUsername ? availability : null
  const isTaken = formatOk && checked && !checked.available
  const isAvailable = formatOk && checked && checked.available
  const isChecking = formatOk && !checked

  // Only show an error once the field has been touched; otherwise the message is empty.
  // "Taken" shows right away, because the user has already typed enough to know.
  const usernameError =
    (touched.username ? validateUsername(username) : '') ||
    (isTaken ? 'That username is taken.' : '')
  const emailError = touched.email ? validateEmail(email) : ''
  const passwordError = touched.password ? validatePassword(password) : ''

  let usernameHint = 'Letters, numbers, and underscores.'
  if (isChecking) usernameHint = 'Checking…'
  if (isAvailable) usernameHint = 'Username is available.'

  // Runs when the form is submitted (button click or Enter key)
  async function handleSubmit(event) {
    // Stops the browser's default behavior of reloading the page on submit
    event.preventDefault()
    setFormError('')
    // Mark all fields as touched so any errors show, even for fields the user skipped
    setTouched({ username: true, email: true, password: true })
    // If anything is wrong, stop here and let the user fix it
    if (validateUsername(username) || validateEmail(email) || validatePassword(password)) return
    if (isTaken) return

    try {
      await signup({ username: username.trim(), email: email.trim(), password })
      navigate('/', { replace: true })
    } catch (err) {
      // e.g. "That username is taken." or "That email is already in use."
      setFormError(err.message)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[27.5rem] flex-col bg-background px-5 py-10 text-ink">

      <h1 className="text-2xl font-bold tracking-tight">Later?</h1>

      <section className="mt-12">
        <h2 className="text-3xl leading-tight font-bold tracking-tight">
          Stop losing places in the group chat.
        </h2>
        <p className="mt-2 text-sm leading-normal text-muted">
          Pick a username so friends can find you.
        </p>
      </section>

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
        <TextField
          label="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          onBlur={() => setTouched((current) => ({ ...current, username: true }))}
          error={usernameError}
          hint={usernameHint}
          autoComplete="username"
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={() => setTouched((current) => ({ ...current, email: true }))}
          error={emailError}
          autoComplete="email"
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onBlur={() => setTouched((current) => ({ ...current, password: true }))}
          error={passwordError}
          hint="At least 8 characters, including a number."
          autoComplete="new-password"
        />

        {formError && (
          <p role="alert" className="text-sm text-red-600">
            {formError}
          </p>
        )}

        <Button type="submit" className="mt-2 w-full">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-brand hover:text-brand-dark">
          Log in
        </Link>
      </p>
    </main>
  )
}