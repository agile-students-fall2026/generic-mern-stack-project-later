import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { lookupLink } from '../api/createFlow'
import BackLink from '../components/BackLink'
import Button from '../components/Button'

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
    <section className="p-4 pb-20">
      {/* Back: goes to Home */}
      <BackLink to="/" label="Back to home" className="mb-6" />
      <h1 className="mb-4 text-[1.75rem] leading-[1.2] font-bold">
        Saw a place?
        <br />
        Drop the link.
      </h1>
      <p className="mb-6 leading-[1.4]">
        Paste a link from TikTok or Instagram. We find the place and pin it to the right city.
      </p>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex items-center rounded-input border border-border bg-surface pr-1">
          <input
            className="min-w-0 flex-1 bg-transparent px-4 py-3 text-ink focus:outline-none"
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
            <Button
              variant="link"
              className="shrink-0 px-2 py-1 text-xl leading-none no-underline"
              aria-label="Clear link"
              onClick={clearLink}
              disabled={finding}
            >
              ×
            </Button>
          )}
        </div>
        {error && (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={finding}>
          {finding ? 'Finding…' : 'Find the place'}
        </Button>
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
