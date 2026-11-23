import { useState } from 'react'
import { useNavigate } from 'react-router'
import { resetPassword } from '../api/auth'

import TextField from '../components/TextField'
import Button from '../components/Button'

function validatePassword(password) {
  if (!password) return 'Enter a new password.'
  if (password.length < 8) return 'Use at least 8 characters.'
  if (!/[0-9]/.test(password)) return 'Include at least one number.'
  return ''
}

// Both boxes have to match, so a typo doesn't lock them out.
function validateConfirm(password, confirm) {
  if (!confirm) return 'Confirm your new password.'
  if (confirm !== password) return 'Passwords do not match.'
  return ''
}

export default function ChangePassword() {
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')

    // Which fields the user has already left, so errors don't show on page load
    const [touched, setTouched] = useState({ password: false, confirm: false })

    // Errors stay blank until the field has been touched
    const passwordError = touched.password ? validatePassword(password) : ''
    const confirmError = touched.confirm ? validateConfirm(password, confirm) : ''

    // The server's message if the request fails
    const [formError, setFormError] = useState('')
    
    async function handleSubmit(event) {
    // Keeps the browser from reloading the page
    event.preventDefault()
    setFormError('')

    // Count both fields as touched so skipped ones show their errors too
    setTouched({ password: true, confirm: true })

    if (validatePassword(password) || validateConfirm(password, confirm)) return

    try {
        await resetPassword(password)
        navigate('/login', { replace: true })
    } catch (err) {
        // e.g. "Pick a password you haven't used here before."
        setFormError(err.message)
    }
}
    return (
        <main className="mx-auto flex min-h-screen w-full max-w-[27.5rem] flex-col bg-background px-5 py-10 text-ink">
        {/* Logo */}
        <h1 className="text-2xl font-bold tracking-tight">Later?</h1>

        <section className="mt-20">
            <h2 className="text-4xl leading-tight font-bold tracking-tight">Set a new password.</h2>
            <p className="mt-2 text-base leading-relaxed text-muted">
            Pick something you haven't used here before.
            </p>
        </section>
        <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-6">
            <TextField
            label="New password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, password: true }))}
            error={passwordError}
            hint="At least 8 characters, including a number."
            autoComplete="new-password"
            />

            <TextField
            label="Confirm new password"
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, confirm: true }))}
            error={confirmError}
            autoComplete="new-password"
            />

            {formError && (
            <p role="alert" className="text-sm text-red-600">
             {formError}
            </p>
            )}
            <Button type="submit" className="mt-4 w-full">
            Update password
            </Button>
        </form>
     </main>
    )
}

        