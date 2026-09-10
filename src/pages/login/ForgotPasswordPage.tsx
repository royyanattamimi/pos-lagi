import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../component/button/Button'
import { Input } from '../../component/input/Input'

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
    <main className="login-page min-h-screen grid grid-cols-1 bg-white text-slate-900 lg:grid-cols-[minmax(320px,0.92fr)_minmax(380px,1fr)]">
      <section className="login-hero min-h-screen flex flex-col justify-between gap-12 bg-neutral-100 p-10 text-neutral-950" aria-label="Reset password POS Lagi">
        <div className="login-brand flex items-center gap-3">
          <span className="brand-mark grid h-12 w-12 place-items-center rounded-lg bg-teal-300 font-black text-teal-950">PL</span>
          <div>
            <strong>POS Lagi</strong>
            <span>Cashier Management System</span>
          </div>
        </div>

        <div className="hero-copy max-w-xl [&_h1]:m-0 [&_h1]:text-4xl [&_h1]:font-extrabold [&_h1]:leading-tight [&_p]:mt-4 [&_p]:text-base [&_p]:leading-7 [&_p]:text-neutral-600">
          <h1>Pulihkan akses akun kasir.</h1>
          <p>Masukkan email akun untuk memulai proses reset password secara aman.</p>
        </div>
      </section>

      <section className="login-card min-h-screen flex flex-col justify-center p-10" aria-label="Form lupa password">
        <div className="login-heading mx-auto mb-6 w-full max-w-md [&_p]:mb-2 [&_p]:text-xs [&_p]:font-extrabold [&_p]:uppercase [&_p]:text-teal-700 [&_h2]:m-0 [&_h2]:text-3xl [&_h2]:font-extrabold [&_h2]:text-slate-900">
          <p>Lupa Password</p>
          <h2>Reset password akun</h2>
        </div>

        <form className="login-form mx-auto grid w-full max-w-md gap-4 rounded-lg border border-slate-200 bg-white p-7 shadow-lg shadow-slate-900/5 [&_label]:grid [&_label]:gap-2 [&_label]:text-sm [&_label]:font-extrabold [&_label]:text-slate-600" onSubmit={handleSubmit}>
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
            <div className="reset-password-state grid gap-1 rounded-lg border border-sky-200 bg-sky-50 p-3 [&_strong]:text-sm [&_strong]:text-sky-900 [&_span]:text-sm [&_span]:leading-6 [&_span]:text-sky-700">
              <strong>Permintaan reset dicatat</strong>
              <span>
                Jika email terdaftar, sistem akan mengirim instruksi reset password ke email tersebut.
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="login-error-state rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold leading-6 text-red-800">
              {errorMessage}
            </div>
          )}

          <Button className="submit-button min-h-12 rounded-lg font-extrabold disabled:cursor-not-allowed disabled:opacity-70" variant="primary" size="large" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Mengirim...' : 'Kirim Instruksi Reset'}
          </Button>
          <Button className="secondary-login-button min-h-12 rounded-lg border border-slate-300 bg-white font-extrabold text-slate-900" type="button" onClick={onBackToLogin}>
            Kembali ke Login
          </Button>
        </form>
      </section>
    </main>
  )
}
