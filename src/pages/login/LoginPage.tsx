import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../component/button/Button'
import { Input } from '../../component/input/Input'
import './LoginPage.css'

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
      <section className="login-hero" aria-label="Kasir">
        <div className="login-brand">
          <span className="brand-mark"></span>
          <div>
            <strong>Kasir</strong>
            <span>Point Of Sale</span>
          </div>
        </div>

        <div className="hero-copy">
          <h1>Kelola transaksi toko dengan lebih rapi.</h1>
          <p>Login untuk masuk ke dashboard kasir, product, transaksi, dan laporan penjualan.</p>
        </div>
      </section>

      <section className="login-card" aria-label="Form login">
        <div className="login-heading">
          <p>Login</p>
          <h2>Masuk ke akun</h2>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
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
            <div className="password-field">
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

          <div className="login-options">
            <label className="remember-field">
              <Input type="checkbox" defaultChecked />
              Ingat saya
            </label>
            <Button className="forgot-password-link" type="button" onClick={onForgotPassword}>
              Lupa password?
            </Button>
          </div>

          {errorMessage && (
            <div className="login-error-state">
              {errorMessage}
            </div>
          )}

          <Button className="submit-button" variant="primary" size="large" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>
      </section>
    </main>
  )
}
