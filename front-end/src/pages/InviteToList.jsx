import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getInviteToListData, sendListInvites } from '../api/listMembers'
import { useApi } from '../hooks/useApi'
import Avatar from '../components/Avatar'
import BackLink from '../components/BackLink'
import Button from '../components/Button'
import { ErrorState, LoadingState } from '../components/LoadState'

export default function InviteToList() {
  const { cityId } = useParams()
  return <InviteForm key={cityId} cityId={cityId} />
}

function InviteForm({ cityId }) {
  const { data, loading, error, retry, setData } = useApi((options) => getInviteToListData(cityId, options), [cityId])
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [copyMessage, setCopyMessage] = useState('')
  const [submitMessage, setSubmitMessage] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [sending, setSending] = useState(false)
  const submission = useRef(null)

  useEffect(() => () => submission.current?.abort(), [])

  if (loading) return <LoadingState message="Loading invitation options…" />
  if (error) {
    return (
      <section className="px-5 py-10 text-center">
        <ErrorState message={error.message} onRetry={error.status === 404 ? undefined : retry} />
        <Link to="/" className="font-semibold text-brand hover:text-brand-dark">Back to your lists</Link>
      </section>
    )
  }

  function toggleFriend(friend) {
    if (friend.alreadyInvited || sending) return
    setSelectedIds((previous) => {
      const next = new Set(previous)
      if (next.has(friend.id)) next.delete(friend.id)
      else next.add(friend.id)
      return next
    })
    setSubmitMessage('')
    setSubmitError('')
  }

  async function copyInviteLink() {
    const url = `${window.location.origin}${data.invitePath}`
    try {
      await navigator.clipboard.writeText(url)
      setCopyMessage('Copied!')
    } catch {
      setCopyMessage(url)
    }
  }

  async function handleInvite() {
    if (submission.current || selectedIds.size === 0) return
    const controller = new AbortController()
    submission.current = controller
    const toUserIds = [...selectedIds]
    setSending(true)
    setSubmitError('')
    setSubmitMessage('')
    try {
      const result = await sendListInvites({ listId: data.listId, toUserIds }, { signal: controller.signal })
      if (controller.signal.aborted) return
      setData((previous) => ({
        ...previous,
        friendsToInvite: previous.friendsToInvite.map((friend) =>
          toUserIds.includes(friend.id) ? { ...friend, alreadyInvited: true } : friend),
      }))
      setSelectedIds(new Set())
      const count = result.created.length
      setSubmitMessage(count
        ? `Invited ${count} friend${count === 1 ? '' : 's'}.`
        : 'These friends are already invited or on the list.')
    } catch (err) {
      if (!controller.signal.aborted) setSubmitError(err.message)
    } finally {
      if (!controller.signal.aborted) {
        submission.current = null
        setSending(false)
      }
    }
  }

  return (
    <section className="px-5 py-6 pb-20">
      <header>
        <BackLink to={`/city/${cityId}`} label={`Back to ${data.cityName}`} className="mb-6" />
        <h1 className="text-3xl font-semibold tracking-tight">Who's coming to {data.cityName}?</h1>
        <p className="mt-2 text-sm text-muted">Invited friends can add places and vote</p>
      </header>
      <section aria-labelledby="invite-choose-heading" className="mt-8">
        <h2 id="invite-choose-heading" className="text-lg font-semibold">Choose friends</h2>
        {data.friendsToInvite.length === 0 ? (
          <p className="mt-3 text-sm text-muted">All your friends are already on this list.</p>
        ) : (
          <ul className="mt-2">
            {data.friendsToInvite.map((friend) => (
              <li key={friend.id}>
                <label className={`flex min-h-20 items-center gap-3 border-b border-border py-3 ${friend.alreadyInvited ? 'opacity-60' : 'cursor-pointer'}`}>
                  <Avatar user={friend} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{friend.name}</span>
                    <span className="block truncate text-sm text-muted">@{friend.username}</span>
                    {friend.alreadyInvited && <span className="block text-xs text-muted">Invite already sent</span>}
                  </span>
                  <input
                    type="checkbox"
                    aria-label={`Invite ${friend.name}`}
                    className="size-5 shrink-0 accent-brand focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-brand"
                    checked={selectedIds.has(friend.id)}
                    disabled={friend.alreadyInvited || sending}
                    onChange={() => toggleFriend(friend)}
                  />
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="invite-already-heading" className="mt-8">
        <h2 id="invite-already-heading" className="text-lg font-semibold">Already in</h2>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex -space-x-3">
            {data.members.slice(0, 3).map((member) => <Avatar key={member.id} user={member} />)}
          </div>
          <span className="text-sm text-muted">{data.members.map((member) => member.name.trim().split(/\s+/)[0]).join(', ')}</span>
        </div>
      </section>
      <div className="mt-8 flex flex-col gap-3">
        <Button variant="secondary" onClick={copyInviteLink}>Copy invite link</Button>
        {copyMessage && <p role="status" className="break-all text-center text-sm text-muted">{copyMessage}</p>}
        <Button disabled={selectedIds.size === 0 || sending} onClick={handleInvite}>
          {sending ? 'Sending…' : 'Invite friends'}
        </Button>
        {submitMessage && <p role="status" className="text-center text-sm text-ink">{submitMessage}</p>}
        {submitError && <p role="alert" className="text-center text-sm text-brand">{submitError}</p>}
      </div>
    </section>
  )
}
