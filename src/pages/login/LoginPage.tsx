import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../component/button/Button'
import { Input } from '../../component/input/Input'

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
    <main className="login-page min-h-screen grid grid-cols-1 bg-[linear-gradient(135deg,#f8fafc_0%,#ecfeff_46%,#f8fafc_100%)] text-slate-900 lg:grid-cols-[minmax(320px,0.92fr)_minmax(380px,1fr)]">
      <section className="login-hero min-h-screen flex flex-col justify-between gap-12 bg-slate-950 p-10 text-white shadow-2xl shadow-slate-950/20" aria-label="Kasir">
        <div className="login-brand flex items-center gap-3">
          <span className="brand-mark grid h-12 w-12 place-items-center rounded-2xl bg-white font-black text-slate-950 shadow-lg shadow-white/10">PL</span>
          <div>
            <strong>Kasir</strong>
            <span>Point Of Sale</span>
          </div>
        </div>

        <div className="hero-copy max-w-xl [&_h1]:m-0 [&_h1]:text-5xl [&_h1]:font-extrabold [&_h1]:leading-tight [&_p]:mt-4 [&_p]:text-base [&_p]:leading-7 [&_p]:text-slate-300">
          <h1>Kelola transaksi toko dengan lebih rapi.</h1>
          <p>Login untuk masuk ke dashboard kasir, product, transaksi, dan laporan penjualan.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {['Produk', 'Transaksi', 'Shift'].map((item) => (
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-xl shadow-black/10 backdrop-blur" key={item}>
              <span className="text-xs font-black uppercase tracking-[0.18em] text-teal-200">{item}</span>
              <strong className="mt-2 block text-2xl font-black">Live</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="login-card min-h-screen flex flex-col justify-center p-6 md:p-10" aria-label="Form login">
        <div className="login-heading mx-auto mb-6 w-full max-w-md [&_p]:mb-2 [&_p]:text-xs [&_p]:font-extrabold [&_p]:uppercase [&_p]:text-teal-700 [&_h2]:m-0 [&_h2]:text-4xl [&_h2]:font-extrabold [&_h2]:text-slate-900">
          <p>Login</p>
          <h2>Masuk ke akun</h2>
        </div>

        <form className="login-form mx-auto grid w-full max-w-md gap-4 rounded-2xl border border-white/70 bg-white/85 p-7 shadow-2xl shadow-slate-950/10 backdrop-blur-xl [&_label]:grid [&_label]:gap-2 [&_label]:text-sm [&_label]:font-extrabold [&_label]:text-slate-600" onSubmit={handleSubmit}>
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

          <Button className="submit-button min-h-12 rounded-xl font-extrabold disabled:cursor-not-allowed disabled:opacity-70" variant="primary" size="large" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>
      </section>
    </main>
  )
}
