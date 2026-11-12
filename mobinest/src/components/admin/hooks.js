import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Loads data for a key (e.g. the serialised filters). Keeps the previous data while a new key
 * loads, ignores stale responses, and exposes reload() plus setData() for optimistic updates.
 */
export function useAdminQuery(load, key) {
  const [state, setState] = useState({ key: null, data: undefined, error: null })
  const [nonce, setNonce] = useState(0)
  const loadRef = useRef(load)
  const reqKey = `${key}#${nonce}`

  useEffect(() => {
    loadRef.current = load
  })

  useEffect(() => {
    let cancelled = false
    loadRef.current().then(
      (data) => !cancelled && setState({ key: reqKey, data, error: null }),
      (error) => !cancelled && setState((s) => ({ key: reqKey, data: s.data, error })),
    )
    return () => {
      cancelled = true
    }
  }, [reqKey])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }))
  }, [])

  const loading = state.key !== reqKey
  return { data: state.data, error: loading ? null : state.error, loading, reload, setData }
}

/**
 * List filters kept in the URL (?status=SHIPPED&page=2), so a filtered view can be bookmarked,
 * shared and survives Back. Changing any filter resets the page to the first one.
 */
export function useListParams(defaults = {}) {
  const [params, setParams] = useSearchParams()
  const defaultsKey = JSON.stringify(defaults)

  const values = useMemo(() => {
    const out = { ...JSON.parse(defaultsKey) }
    params.forEach((value, k) => {
      if (k !== 'preview' && k !== 'theme') out[k] = value
    })
    return out
  }, [params, defaultsKey])

  const update = useCallback(
    (patch) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          Object.entries(patch).forEach(([k, v]) => {
            if (v === undefined || v === null || v === '' || v === false) next.delete(k)
            else next.set(k, String(v))
          })
          if (!('page' in patch)) next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const reset = useCallback(() => {
    setParams((prev) => {
      const next = new URLSearchParams()
      if (prev.has('preview')) next.set('preview', prev.get('preview'))
      return next
    }, { replace: true })
  }, [setParams])

  return [values, update, reset]
}

/** Value that only updates after the user stops typing for `delay` ms. */
export function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
