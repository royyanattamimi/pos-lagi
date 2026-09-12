import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../component/button/Button'
import { Input } from '../../component/input/Input'
import { Store, ArrowRight } from 'lucide-react'

type LoginPageProps = {
  onLogin: (email: string, password: string) => Promise<void>
  onForgotPassword: () => void
}

export function LoginPage({ onLogin, onForgotPassword }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await onLogin(email.trim(), password)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Login gagal. Coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <img className="login-backdrop" src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2400&q=85" alt="Interior toko dengan koleksi pakaian" />
      <section className="login-card" aria-label="Form login">
        <div className="login-brand"><span className="brand-symbol"><Store size={24} aria-hidden="true" /></span><div><h1>POS Lagi<span className="text-emerald-600">.</span></h1><span>Point of sale</span></div></div>
        <div className="login-heading mx-auto mb-6 w-full max-w-md [&_p]:mb-2 [&_p]:text-xs [&_p]:font-extrabold [&_p]:uppercase [&_p]:text-teal-700 [&_h2]:m-0 [&_h2]:text-3xl [&_h2]:font-extrabold [&_h2]:text-slate-900">
          <p>WORKSPACE TOKO</p>
          <h2>Selamat datang kembali</h2>
        </div>

        <form className="login-form form-stack mx-auto w-full max-w-md" onSubmit={handleSubmit}>
          <label>
            Email
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@poslagi.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <div className="password-field relative [&_input]:pr-14 [&_button]:absolute [&_button]:right-3 [&_button]:top-1/2 [&_button]:grid [&_button]:h-7 [&_button]:min-h-7 [&_button]:w-7 [&_button]:-translate-y-1/2 [&_button]:place-items-center [&_button]:rounded-full [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-0 [&_button]:text-slate-500 [&_button:hover]:bg-teal-50 [&_button:hover]:text-teal-700 [&_svg]:h-5 [&_svg]:w-5 [&_svg]:fill-none [&_svg]:stroke-current">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Masukkan password"
                autoComplete="current-password"
                required
              />
              <Button
                type="button"
                onClick={() => setShowPassword((currentValue) => !currentValue)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? (
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5 0 8.5 4 10 8a12.6 12.6 0 0 1-2.1 3.5" />
                    <path d="M6.6 6.6A12.3 12.3 0 0 0 2 12c1.5 4 5 8 10 8 1.7 0 3.2-.4 4.5-1.1" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M2 12s3.5-8 10-8 10 8 10 8-3.5 8-10 8S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </Button>
            </div>
          </label>

          <div className="login-options flex items-center justify-between gap-3">
            <label className="remember-field flex items-center gap-2 text-sm font-bold text-slate-600 [&_input]:h-4 [&_input]:min-h-4 [&_input]:w-4 [&_input]:accent-teal-700">
              <Input type="checkbox" defaultChecked />
              Ingat saya
            </label>
            <Button className="forgot-password-link border-0 bg-transparent p-0 font-extrabold text-teal-700" type="button" onClick={onForgotPassword}>
              Lupa password?
            </Button>
          </div>

          {errorMessage && (
            <div className="login-error-state rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold leading-6 text-red-800">
              {errorMessage}
            </div>
          )}

          <Button className="submit-button w-full disabled:cursor-not-allowed disabled:opacity-70" variant="primary" size="large" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Memproses...' : 'Masuk'}
            <ArrowRight aria-hidden="true" />
          </Button>
        </form>
        <p className="login-footer">POS Lagi / Cabang Utama</p>
      </section>
    </main>
  )
}
