import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      if (!data.session) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!mounted) return
      setSession(s)
      if (!s) { setProfile(null); setLoading(false) }
    })

    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!session?.user?.id) return
    let mounted = true

    supabase
      .from('vote_profiles')
      .select('id, email, full_name, role, is_active')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (!mounted) return
        if (err || !data) {
          setError('No admin profile linked to this account')
          setProfile(null)
        } else if (!['admin', 'super_admin', 'officer'].includes(data.role)) {
          setError('This account does not have admin access')
          setProfile(null)
        } else {
          setProfile(data)
          setError('')
        }
        setLoading(false)
      })

    return () => { mounted = false }
  }, [session?.user?.id])

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    error,
    signOut,
    isAdmin: !!profile && ['admin', 'super_admin'].includes(profile.role),
    isSuperAdmin: profile?.role === 'super_admin'
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
