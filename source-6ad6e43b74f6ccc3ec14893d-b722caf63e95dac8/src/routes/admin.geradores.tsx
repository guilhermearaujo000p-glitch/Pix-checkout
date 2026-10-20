import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowUpRight, Zap } from 'lucide-react'

import { PageHeader } from '@/components/checkout/app-shell'
import { usePreview } from '@/lib/preview-store'

export const Route = createFileRoute('/admin/geradores')({
  component: AdminGenerators,
})

function AdminGenerators() {
  const collaborators = usePreview((s) => s.collaborators)
  return (
    <>
      <PageHeader
        title="Geradores PIX"
        description="Gere cobranças em nome de qualquer colaborador. O split de cada um é aplicado automaticamente."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {collaborators.map((c) => (
          <Link
            key={c.slug}
            to="/$slug"
            params={{ slug: c.slug }}
            className="group rounded-2xl border bg-card p-5 transition-colors hover:border-primary/60 motion-reduce:transition-none"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
                <Zap className="size-5" aria-hidden />
              </div>
              <ArrowUpRight className="size-5 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden />
            </div>
            <p className="mt-4 font-display text-lg font-semibold">{c.title}</p>
            <p className="text-sm text-muted-foreground">{c.name}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-md bg-secondary px-2 py-1 font-mono">/{c.slug}</span>
              <span className="rounded-md bg-secondary px-2 py-1">
                {c.splitPercent}% colaborador · 1% principal
              </span>
              {!c.active ? (
                <span className="rounded-md bg-destructive/15 px-2 py-1 text-destructive">Desativado</span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
