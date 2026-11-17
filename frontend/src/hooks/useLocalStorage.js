import { useEffect, useState } from 'react'

const read = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

/** useState that persists to localStorage (namespaced, failure-tolerant). */
export function useLocalStorage(key, initialValue) {
  const storageKey = `mobinest:${key}`
  const [value, setValue] = useState(() => read(storageKey, initialValue))

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      /* storage full or unavailable (private mode) – keep in-memory state */
    }
  }, [storageKey, value])

  return [value, setValue]
}

export const readStored = (key, fallback) => read(`mobinest:${key}`, fallback)
