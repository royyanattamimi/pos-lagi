import { useState } from 'react'
import type { FormEvent } from 'react'
import './LoginPage.css'

type LoginPageProps = {
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onLogin()
  }

  return (
    <main className="login-page">
      <section className="login-hero" aria-label="POS Lagi">
        <div className="login-brand">
          <span className="brand-mark">PL</span>
          <div>
            <strong>POS Lagi</strong>
            <span>Cashier Management System</span>
          </div>
        </div>

        <div className="hero-copy">
          <h1>Kelola transaksi toko dengan lebih rapi.</h1>
          <p>Login untuk masuk ke dashboard kasir, product, stok, dan laporan penjualan.</p>
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
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@poslagi.com"
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Masukkan password"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword((currentValue) => !currentValue)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <div className="login-options">
            <label className="remember-field">
              <input type="checkbox" defaultChecked />
              Ingat saya
            </label>
            <a href="#forgot-password">Lupa password?</a>
          </div>

          <button className="submit-button" type="submit">Masuk</button>
        </form>
      </section>
    </main>
  )
}
