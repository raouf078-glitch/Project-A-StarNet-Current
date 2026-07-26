import { useState, useEffect } from 'react'
import { auth } from '../lib/auth'
import PhoneLogin from './PhoneLogin'

// Wraps financial pages — shows phone login if not authenticated
export default function AuthGate({ children }) {
  const [session, setSession] = useState(auth.getSession())
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const unsub = auth.onAuthChange((sess) => {
      setSession(sess)
      setChecking(false)
    })
    return unsub
  }, [])

  if (checking) {
    return (
      <div className="min-h-full flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return <PhoneLogin onSuccess={() => setSession(auth.getSession())} />
  }

  return children
}
