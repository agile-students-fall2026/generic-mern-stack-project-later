import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { lookupLink } from '../api/createFlow'
import './Create.css'
import BackLink from '../components/BackLink'

export default function Create() {
  const navigate = useNavigate()
  const location = useLocation()
  // What the user typed in the link box
  const [link, setLink] = useState(location.state?.sourceUrl ?? '')
  const [manualSearch, setManualSearch] = useState(null)
  // Shown when the link is blank, unknown, or the server can't be reached
  const [error, setError] = useState('')
  // True while the lookup request is on its way, so the button can't be pressed twice
  const [finding, setFinding] = useState(false)
  function clearLink() {
    setLink('')
    setError('')
    setManualSearch(null)
  }

  async function handleSubmit(event) {
    // Keep the page from reloading (default form behavior)
    event.preventDefault()
    const sourceUrl = link.trim()
    setError('')
    setManualSearch(null)
    setFinding(true)
    try {
      const result = await lookupLink(sourceUrl)
      // These two are normal answers, not HTTP errors. The server still returns 200.
      if (result.status === 'empty') {
        setError('Paste a link first.')
        return
      }
      if (result.status === 'not_found') {
        setError('We could not find a place for that link. You can search for it yourself.')
        setManualSearch({ sourceUrl })
        return
      }
      const { lookup } = result
      // Carry candidates and cityId forward. The next pages read them from
      // navigation state instead of calling the mock data layer.
      const nextState = {
        sourceUrl,
        lookup,
        candidates: result.candidates ?? [],
        cityId: result.cityId,
      }
      // lookup.status is a second, different status. "ok" above only means
      // the URL was in the demo list.
      if (lookup.status === 'found') {
        navigate('/create/identifying', { state: nextState })
        return
      }
      if (lookup.status === 'ambiguous') {
        navigate('/create/matches', { state: nextState })
        return
      }
      // The demo link exists, but it has no place (lk_4).
      setError('We could not find a place for that link.')
      setManualSearch(nextState)
    } catch (err) {
      // err.message is the server's { error: "..." }, or "Can't reach the server..."
      setError(err.message)
    } finally {
      setFinding(false)
    }
  }

  return (
    <section className="add-place">
      {/* Back: goes to Home */}
      <BackLink to="/" label="Back to home" className="mb-6" />
      <h1 className="add-place-title">
        Saw a place?
        <br />
        Drop the link.
      </h1>
      <p className="add-place-hint">
        Paste a link from TikTok or Instagram. We find the place and pin it to the right city.
      </p>
      <form className="add-place-form" onSubmit={handleSubmit}>
        <div className="add-place-input-wrap">
          <input
            className="input-field"
            type="url"
            name="link"
            value={link}
            onChange={(event) => {
              setLink(event.target.value)
              setError('')
              setManualSearch(null)
            }}
            disabled={finding}
            placeholder="link…"
            autoComplete="off"
          />
          {/* Only show clear when there is text in the box */}
          {link.length > 0 && (
            <button
              type="button"
              className="add-place-clear"
              aria-label="Clear link"
              onClick={clearLink}
              disabled={finding}
            >
              ×
            </button>
          )}
        </div>
        {error && (
          <p className="add-place-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary hover:btn-primary-hover" disabled={finding}>
          {finding ? 'Finding…' : 'Find the place'}
        </button>
        {manualSearch && (
          <Link to="/create/search" state={manualSearch} className="min-h-11 btn-secondary text-center hover:bg-subtle">
            Search manually
          </Link>
        )}
      </form>
    </section>
  )
}
/*
  Demo URLs (can copy-paste for test):
  Found (NYC):
  https://www.tiktok.com/@nyceats/video/7301
  Found (Paris):
  https://www.instagram.com/p/septime-paris
  Ambiguous - /create/matches:
  https://www.instagram.com/reel/paris-croissant
  Not found (error on this page):
  https://www.tiktok.com/@random/video/0000
*/
