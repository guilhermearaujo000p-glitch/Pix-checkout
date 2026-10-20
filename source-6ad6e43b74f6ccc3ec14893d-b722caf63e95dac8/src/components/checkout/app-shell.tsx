import { Link, useNavigate } from '@tanstack/react-router'
import { LogOut, ShieldAlert } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

import { Brand } from '@/components/checkout/brand'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { loadSession, signOut, usePreview, type Session } from '@/lib/preview-store'
import { cn } from '@/lib/utils'

type NavItem = { to: string; label: string; params?: Record<string, string>; exact?: boolean }

function navFor(session: Session): NavItem[] {
  if (session.role === 'admin') {
    return [
      { to: '/admin', label: 'Visão geral', exact: true },
      { to: '/admin/geradores', label: 'Geradores' },
      { to: '/admin/cobrancas', label: 'Cobranças' },
      { to: '/admin/colaboradores', label: 'Colaboradores' },
      { to: '/admin/configuracoes', label: 'Configurações' },
    ]
  }
  return [{ to: '/$slug', label: 'Meu gerador', params: { slug: session.slug }, exact: true }]
}

export function AppShell({ session, children }: { session: Session; children: ReactNode }) {
  const displayName = usePreview((s) => s.displayName)
  const navigate = useNavigate()
  const items = navFor(session)

  return (
    <div className="min-h-screen bg-[radial-gradient(60rem_30rem_at_80%_-10%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent)]">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-4 sm:px-6">
          <Brand
            name={displayName}
            subtitle={session.role === 'admin' ? 'Painel administrativo' : `Colaborador · ${session.name}`}
          />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
            {items.map((item) => (
              <NavLink key={item.to} item={item} />
            ))}
          </nav>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              signOut()
              void navigate({ to: '/' })
            }}
          >
            <LogOut />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
        {items.length > 1 ? (
          <nav
            className="flex gap-1 overflow-x-auto border-t px-4 py-2 md:hidden"
            aria-label="Principal (celular)"
          >
            {items.map((item) => (
              <NavLink key={item.to} item={item} />
            ))}
          </nav>
        ) : null}
      </header>
      <main className="mx-auto max-w-content px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  )
}

function NavLink({ item }: { item: NavItem }) {
  return (
    <Link
      // As rotas são tipadas; aqui recebemos destinos já conhecidos de navFor().
      to={item.to as '/admin'}
      params={item.params as never}
      activeOptions={{ exact: item.exact }}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-foreground motion-reduce:transition-none',
      )}
      activeProps={{ className: 'bg-accent !text-foreground' }}
    >
      {item.label}
    </Link>
  )
}

/**
 * Proteção de tela na prévia. Na Etapa 3 a mesma regra passa a ser aplicada
 * no servidor (sessão em cookie httpOnly + verificação em cada função).
 */
export function Protected({
  allow,
  children,
}: {
  allow: (s: Session) => boolean
  children: (session: Session) => ReactNode
}) {
  const session = usePreview((s) => s.session)
  const loaded = usePreview((s) => s.sessionLoaded)
  const navigate = useNavigate()

  useEffect(() => loadSession(), [])
  useEffect(() => {
    if (loaded && !session) void navigate({ to: '/' })
  }, [loaded, session, navigate])

  if (!loaded || !session) {
    return (
      <div className="mx-auto max-w-content space-y-4 px-4 py-10 sm:px-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!allow(session)) {
    return (
      <AppShell session={session}>
        <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center">
          <ShieldAlert className="mx-auto size-10 text-destructive" aria-hidden />
          <h1 className="mt-4 font-display text-xl font-semibold">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu acesso permite apenas o seu próprio gerador e as suas cobranças.
          </p>
          {session.role === 'collaborator' ? (
            <Button asChild className="mt-6">
              <Link to="/$slug" params={{ slug: session.slug }}>
                Ir para o meu gerador
              </Link>
            </Button>
          ) : null}
        </div>
      </AppShell>
    )
  }

  return <AppShell session={session}>{children(session)}</AppShell>
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions}
    </div>
  )
}
