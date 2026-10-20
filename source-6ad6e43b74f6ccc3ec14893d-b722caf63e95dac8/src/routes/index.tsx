import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'

import { Brand } from '@/components/checkout/brand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loadSession, signIn, usePreview } from '@/lib/preview-store'

export const Route = createFileRoute('/')({
  component: LoginPage,
})

const previewLogins = ['admin', 'andre', 'mariana', 'rodrigo', 'thalwan']

function LoginPage() {
  const navigate = useNavigate()
  const displayName = usePreview((s) => s.displayName)
  const session = usePreview((s) => s.session)
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => loadSession(), [])
  useEffect(() => {
    if (!session) return
    if (session.role === 'admin') void navigate({ to: '/admin' })
    else void navigate({ to: '/$slug', params: { slug: session.slug } })
  }, [session, navigate])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!login.trim() || !password) {
      setError('Informe login e senha.')
      return
    }
    setLoading(true)
    setError('')
    await new Promise((r) => setTimeout(r, 400))
    const s = signIn(login)
    setLoading(false)
    if (!s) setError('Login ou senha inválidos, ou acesso desativado.')
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_minmax(28rem,36rem)]">
      <section className="relative hidden overflow-hidden border-r bg-sidebar lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(40rem_24rem_at_20%_20%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent),linear-gradient(to_right,color-mix(in_oklch,var(--foreground)_4%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--foreground)_4%,transparent)_1px,transparent_1px)] bg-[size:auto,48px_48px,48px_48px]"
        />
        <div className="relative">
          <Brand name={displayName} subtitle="Acesso restrito" />
        </div>
        <div className="relative max-w-md">
          <p className="font-display text-4xl leading-tight font-semibold tracking-tight">
            Cobranças PIX com split automático, direto do seu gerador.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <ShieldCheck className="size-5 shrink-0 text-primary" aria-hidden />
              QR Code e copia e cola oficiais da Pagar.me
            </li>
            <li className="flex gap-3">
              <ShieldCheck className="size-5 shrink-0 text-primary" aria-hidden />
              Split definido no servidor: 99% colaborador · 1% principal
            </li>
            <li className="flex gap-3">
              <ShieldCheck className="size-5 shrink-0 text-primary" aria-hidden />
              Cada colaborador acessa somente as próprias cobranças
            </li>
          </ul>
        </div>
        <p className="relative text-xs text-muted-foreground">
          Pagamentos processados pela Pagar.me (API V5)
        </p>
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Brand name={displayName} subtitle="Acesso restrito" />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Entrar</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use o login e a senha fornecidos pelo administrador.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="login">Login</Label>
              <Input
                id="login"
                autoComplete="username"
                autoCapitalize="none"
                className="h-11"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="h-11 pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:text-foreground"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" size="lg" className="h-12 w-full font-semibold" disabled={loading}>
              {loading ? (
                <Loader2 className="animate-spin motion-reduce:animate-none" />
              ) : (
                <LockKeyhole />
              )}
              Entrar
            </Button>
          </form>

          <div className="mt-10 rounded-xl border border-dashed p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Acessos da prévia (qualquer senha)
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {previewLogins.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    setLogin(l)
                    setPassword('previa')
                  }}
                  className="rounded-full border bg-secondary px-3 py-1 font-mono text-xs transition-colors hover:border-primary hover:text-primary motion-reduce:transition-none"
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
