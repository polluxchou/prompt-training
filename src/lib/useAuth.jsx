import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase.js'
import { setSyncContext, hydrateFromCloud } from './generationsStore.js'

const AuthCtx = createContext({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null)
      setSyncContext(null)
      return
    }
    loadProfile(session.user.id).then((p) => {
      setProfile(p)
      setSyncContext({
        userId: session.user.id,
        email: p?.email || session.user.email || '',
      })
      hydrateFromCloud().catch((err) =>
        console.error('[useAuth] hydrate generations failed', err),
      )
    })
  }, [session?.user?.id])

  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, invite_code, invited_by, invited_count, created_at')
      .eq('id', userId)
      .maybeSingle()
    if (error) {
      console.error('[useAuth] load profile failed', error)
      return null
    }
    return data
  }

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      profile,
      loading,
      signOut: () => supabase.auth.signOut(),
      refreshProfile: async () => {
        if (!session?.user?.id) return
        setProfile(await loadProfile(session.user.id))
      },
    }),
    [session, profile, loading]
  )

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  return useContext(AuthCtx)
}
