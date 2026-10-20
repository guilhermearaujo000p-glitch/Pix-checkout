import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, CheckCircle2, Clock3, History, Receipt } from 'lucide-react'
import { useMemo } from 'react'

import { PageHeader } from '@/components/checkout/app-shell'
import { StatusBadge } from '@/components/checkout/status-badge'
import { Button } from '@/components/ui/button'
import { formatBRL, formatDateTime, splitPreview } from '@/lib/format'
import { usePreview } from '@/lib/preview-store'

export const Route = createFileRoute('/admin/')({
  component: AdminOverview,
})

function AdminOverview() {
  const charges = usePreview((s) => s.charges)
  const collaborators = usePreview((s) => s.collaborators)
  const audit = usePreview((s) => s.audit)

  const stats = useMemo(() => {
    const sum = (f: (c: (typeof charges)[number]) => boolean) =>
      charges.filter(f).reduce((s, c) => s + c.amountCents, 0)
    return {
      total: sum(() => true),
      paid: sum((c) => c.status === 'paid'),
      pending: sum((c) => c.status === 'pending'),
      count: charges.length,
    }
  }, [charges])

  const perCollaborator = useMemo(
    () =>
      collaborators.map((col) => {
        const own = charges.filter((c) => c.collaboratorSlug === col.slug)
        const paid = own.filter((c) => c.status === 'paid').reduce((s, c) => s + c.amountCents, 0)
        const pending = own
          .filter((c) => c.status === 'pending')
          .reduce((s, c) => s + c.amountCents, 0)
        return { col, paid, pending, count: own.length }
      }),
    [charges, collaborators],
  )
  const maxPaid = Math.max(1, ...perCollaborator.map((p) => p.paid))
  const principalShare = splitPreview(stats.paid).principal

  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Todas as cobranças dos quatro checkouts, em tempo real."
        actions={
          <Button asChild>
            <Link to="/admin/geradores">
              Gerar PIX <ArrowRight />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Receipt} label="Total gerado" value={formatBRL(stats.total)} hint={`${stats.count} cobranças`} />
        <Stat icon={CheckCircle2} label="Confirmado" value={formatBRL(stats.paid)} hint="Confirmação oficial Pagar.me" accent />
        <Stat icon={Clock3} label="Pendente" value={formatBRL(stats.pending)} hint="Aguardando pagamento" />
        <Stat icon={History} label="Recebedor principal (1%)" value={formatBRL(principalShare)} hint="Sobre o confirmado, bruto" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold">Totais por colaborador</h2>
          <p className="text-sm text-muted-foreground">Valores confirmados e pendentes, brutos.</p>
          <ul className="mt-6 space-y-5">
            {perCollaborator.map(({ col, paid, pending, count }) => (
              <li key={col.slug}>
                <div className="flex items-baseline justify-between gap-3">
                  <Link
                    to="/$slug"
                    params={{ slug: col.slug }}
                    className="font-medium hover:text-primary"
                  >
                    {col.title}
                  </Link>
                  <span className="font-display font-semibold tabular-nums">{formatBRL(paid)}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(paid / maxPaid) * 100}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {count} cobranças · {formatBRL(pending)} pendente
                  {!col.active ? ' · desativado' : ''}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Últimas cobranças</h2>
            <Link to="/admin/cobrancas" className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          </div>
          <ul className="mt-4 divide-y">
            {charges.slice(0, 6).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.customerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {collaborators.find((x) => x.slug === c.collaboratorSlug)?.title} ·{' '}
                    {formatDateTime(c.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-display text-sm font-semibold tabular-nums">
                    {formatBRL(c.amountCents)}
                  </span>
                  <StatusBadge status={c.status} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border bg-card p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold">Log de auditoria</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {audit.slice(0, 8).map((a) => (
            <li key={a.id} className="flex flex-wrap gap-x-3 gap-y-0.5">
              <span className="font-mono text-xs text-muted-foreground">{formatDateTime(a.at)}</span>
              <span className="text-xs text-primary">{a.actor}</span>
              <span>{a.action}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: typeof Receipt
  label: string
  value: string
  hint: string
  accent?: boolean
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {label}
        <Icon className={accent ? 'size-4 text-primary' : 'size-4'} aria-hidden />
      </div>
      <p
        className={`mt-3 font-display text-2xl font-semibold tracking-tight tabular-nums ${accent ? 'text-primary' : ''}`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}
