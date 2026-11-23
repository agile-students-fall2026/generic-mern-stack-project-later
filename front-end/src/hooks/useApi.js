import { useCallback, useEffect, useState } from 'react'

// A result belongs to one dependency set and retry. Never show a previous
// city's/place's data while the next request is still loading.
export function useApi(load, deps = []) {
  const [result, setResult] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const current = result?.reloadKey === reloadKey && result.deps.length === deps.length
    && result.deps.every((value, index) => Object.is(value, deps[index]))

  useEffect(() => {
    const controller = new AbortController()
    Promise.resolve().then(() => load({ signal: controller.signal }))
      .then((data) => {
        if (!controller.signal.aborted) setResult({ data, error: null, deps, reloadKey })
      })
      .catch((error) => {
        if (error.name !== 'AbortError' && !controller.signal.aborted) {
          setResult({ data: null, error, deps, reloadKey })
        }
      })
    return () => controller.abort()
  }, [...deps, reloadKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const retry = useCallback(() => setReloadKey((key) => key + 1), [])
  const setData = useCallback((value) => {
    setResult((previous) => previous
      ? { ...previous, data: typeof value === 'function' ? value(previous.data) : value }
      : previous)
  }, [])
  return { data: current ? result.data : null, error: current ? result.error : null, loading: !current, retry, setData }
}
