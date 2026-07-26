import { useState, useEffect } from 'react'
import { auth } from '../lib/auth'
import NewLoginScreen from './NewLoginScreen'
import RegistrationScreen from './RegistrationScreen'

// Wraps financial pages — shows login if not authenticated
export default function AuthGate({ children }) {
  const [session, setSession] = useState(auth.getSession())
  const [checking, setChecking] = useState(true)
  const [view, setView] = useState('login') // login | register

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
    if (view === 'register') {
      return (
        <RegistrationScreen
          onBack={() => setView('login')}
          onGoLogin={() => setView('login')}
        />
      )
    }
    return (
      <NewLoginScreen
        onSuccess={() => setSession(auth.getSession())}
        onGoRegister={() => setView('register')}
      />
    )
  }

  return children
}
