import { useState } from 'react'
import { Link } from 'react-router'
import TextField from '../components/TextField'
import Button from '../components/Button'

function validateEmail(email) {
  if (!email.trim()) return 'Enter your email.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.'
  return ''
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('')

  // Has the user left the email box yet? Keeps the error hidden until they have.
  const [touched, setTouched] = useState(false)

  // Flips to true after a successful submit, which swaps the form for the
  // "check your inbox" message.
  const [sent, setSent] = useState(false)

  // Error stays blank until the field has been touched
  const emailError = touched ? validateEmail(email) : ''

  function handleSubmit(event) {
    // Keeps the browser from reloading the page
    event.preventDefault()

    // Count the field as touched so an empty box shows its error
    setTouched(true)

    // Something's wrong, so stay here and let them fix it
    if (validateEmail(email)) return

    // TODO: replace with a real backend call that emails a reset link.
    // Only show the success message once the request goes through.
    setSent(true)
  }

  // Lets someone who typo'd their email go back and try again
  function handleUseDifferentEmail() {
    setSent(false)
    setTouched(false)
    setEmail('')
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[27.5rem] flex-col bg-background px-5 py-10 text-ink">
      {/* Logo */}
      <h1 className="text-2xl font-bold tracking-tight">Later?</h1>

      {sent ? (
        // Success state: shown after the form is submitted
        <>
          <section className="mt-20">
            <h2 className="text-4xl leading-tight font-bold tracking-tight">
              Check your inbox.
            </h2>
            {/* Worded as "if" on purpose, so we never reveal whether an account exists */}
            <p className="mt-2 text-base leading-relaxed text-muted">
              If an account exists for {email.trim()}, we just sent a link to
              reset your password.
            </p>
          </section>

          <div className="mt-8 flex flex-col gap-4">
            {/* Styled like a button, but it's a link because it goes to another page */}
            <Link to="/login" className="block min-h-11 w-full text-center btn-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
              Back to log in
            </Link>
            <button
              type="button"
              onClick={handleUseDifferentEmail}
              className="self-center border-0 bg-transparent text-sm font-semibold text-brand hover:text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
              Use a different email
            </button>
          </div>
        </>
      ) : (
        // Default state: the form
        <>
          <section className="mt-20">
            <h2 className="text-4xl leading-tight font-bold tracking-tight">
              Forgot your password?
            </h2>
            <p className="mt-2 text-base leading-relaxed text-muted">
              Enter your email and we'll send you a link to reset it.
            </p>
          </section>

          {/* noValidate turns off the browser's own popups */}
          <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-6">
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              // Clicking away counts as "done with this field"
              onBlur={() => setTouched(true)}
              error={emailError}
              autoComplete="email"
            />

            {/* Colors come from btn-primary in index.css, layout from ForgotPassword.css */}
            <Button type="submit" className= "mt-4 min-h-11 w-full btn-primary hover:btn-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
              Send reset link
            </Button>
          </form>

          {/* For people who remembered it after all */}
          <p className="mt-8 text-center text-sm text-ink">
            Remembered it?{' '}
            <Link to="/login" className="font-bold text-brand hover:text-brand-dark">
              Log in
            </Link>
          </p>
        </>
      )}
    </main>
  )

}