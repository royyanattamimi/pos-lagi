import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../component/button/Button'
import { Input } from '../../component/input/Input'
import './LoginPage.css'

type ForgotPasswordPageProps = {
  onBackToLogin: () => void
  onResetPassword: (email: string) => Promise<void>
}

export function ForgotPasswordPage({ onBackToLogin, onResetPassword }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await onResetPassword(email.trim())
      setIsSubmitted(true)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Reset password gagal. Coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-hero" aria-label="Reset password POS Lagi">
        <div className="login-brand">
          <span className="brand-mark">PL</span>
          <div>
            <strong>POS Lagi</strong>
            <span>Cashier Management System</span>
          </div>
        </div>

        <div className="hero-copy">
          <h1>Pulihkan akses akun kasir.</h1>
          <p>Masukkan email akun untuk memulai proses reset password secara aman.</p>
        </div>
      </section>

      <section className="login-card" aria-label="Form lupa password">
        <div className="login-heading">
          <p>Lupa Password</p>
          <h2>Reset password akun</h2>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email akun
            <Input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setIsSubmitted(false)
                setErrorMessage('')
              }}
              placeholder="Masukkan email akun"
              autoComplete="email"
              required
            />
          </label>

          {isSubmitted && (
            <div className="reset-password-state">
              <strong>Permintaan reset dicatat</strong>
              <span>
                Jika email terdaftar, sistem akan mengirim instruksi reset password ke email tersebut.
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="login-error-state">
              {errorMessage}
            </div>
          )}

          <Button className="submit-button" variant="primary" size="large" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Mengirim...' : 'Kirim Instruksi Reset'}
          </Button>
          <Button className="secondary-login-button" type="button" onClick={onBackToLogin}>
            Kembali ke Login
          </Button>
        </form>
      </section>
    </main>
  )
}
