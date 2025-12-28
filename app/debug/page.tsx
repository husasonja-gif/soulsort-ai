'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DebugPage() {
  const [authState, setAuthState] = useState<any>(null)
  const [cookies, setCookies] = useState<string>('')
  const [localStorage, setLocalStorage] = useState<any>({})

  useEffect(() => {
    // Check auth state
    supabase.auth.getUser().then(({ data, error }) => {
      setAuthState({ user: data.user, error })
    })

    // Check cookies
    setCookies(document.cookie)

    // Check localStorage
    const ls: any = {}
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key) {
        ls[key] = window.localStorage.getItem(key)
      }
    }
    setLocalStorage(ls)
  }, [])

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Debug Info</h1>
      
      <div className="space-y-6">
        <section className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Auth State</h2>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
            {JSON.stringify(authState, null, 2)}
          </pre>
        </section>

        <section className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Cookies</h2>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
            {cookies || 'No cookies found'}
          </pre>
        </section>

        <section className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">LocalStorage</h2>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
            {JSON.stringify(localStorage, null, 2)}
          </pre>
        </section>

        <section className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Quick Checks</h2>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Has User:</strong> {authState?.user ? 'Yes ✅' : 'No ❌'}
            </div>
            <div>
              <strong>User Email:</strong> {authState?.user?.email || 'N/A'}
            </div>
            <div>
              <strong>Has Supabase Cookies:</strong>{' '}
              {cookies.includes('sb-') || cookies.includes('supabase') ? 'Yes ✅' : 'No ❌'}
            </div>
            <div>
              <strong>Error:</strong> {authState?.error?.message || 'None'}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}




