'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { Mountain } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { error: showError } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const supabase = getSupabaseClient()

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        showError('Anmeldung fehlgeschlagen', error.message)
      } else {
        router.push('/dashboard')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleMagicLink() {
    if (!email) {
      showError('Bitte E-Mail-Adresse eingeben')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) {
        showError('Magic Link fehlgeschlagen', error.message)
      } else {
        setMagicLinkSent(true)
      }
    } finally {
      setLoading(false)
    }
  }

  if (magicLinkSent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E3A5F] to-[#2563EB] p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <Mountain className="h-12 w-12 text-[#F97316] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#1E3A5F] mb-2">Magic Link gesendet!</h2>
          <p className="text-gray-600 text-sm">
            Prüfe deine E-Mails an <strong>{email}</strong> und klicke auf den Link zur Anmeldung.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E3A5F] to-[#2563EB] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Mountain className="h-16 w-16 text-white mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-white">Hütten-Manager</h1>
          <p className="text-blue-200 text-sm mt-1">Version 5.0</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-[#1E3A5F] mb-6">Anmelden</h2>

          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@beispiel.de"
                required
                className="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Passwort
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Anmelden
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-500">
              <span className="bg-white px-2">oder</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleMagicLink}
            loading={loading}
            type="button"
          >
            Magic Link per E-Mail
          </Button>
        </div>
      </div>
    </main>
  )
}

