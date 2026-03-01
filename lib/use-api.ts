'use client'

// lib/use-api.ts

import { useState, useEffect, useCallback, useRef, DependencyList } from 'react'
import { ApiError } from './api'

interface UseApiResult<T> {
  data:    T | null
  loading: boolean
  error:   string | null
  refetch: () => Promise<void>
}

export function useApi<T>(
  fn:   () => Promise<T>,
  deps: DependencyList = [],
): UseApiResult<T> {
  const [data,    setData]    = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const fnRef = useRef(fn)
  fnRef.current = fn

  // BUG FIX: fetch must be re-created when deps change so the useEffect re-runs.
  // Previous version had empty deps [] on useCallback — so refreshKey changes
  // never triggered a re-fetch.
  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fnRef.current()
      setData(result)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong'
      setError(message)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}

// ─── Mutation hook ────────────────────────────────────────────────────────────

interface UseMutationResult<TInput, TOutput> {
  mutate:  (input: TInput) => Promise<TOutput>
  loading: boolean
  error:   string | null
  reset:   () => void
}

export function useMutation<TInput = any, TOutput = any>(
  fn: (input: TInput) => Promise<TOutput>,
): UseMutationResult<TInput, TOutput> {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const fnRef = useRef(fn)
  fnRef.current = fn

  const mutate = useCallback(async (input: TInput): Promise<TOutput> => {
    setLoading(true)
    setError(null)
    try {
      const result = await fnRef.current(input)
      return result
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setError(null)
    setLoading(false)
  }, [])

  return { mutate, loading, error, reset }
}