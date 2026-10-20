import { Link } from '@tanstack/react-router'
import { ExternalLink, Inbox } from 'lucide-react'
import { useMemo, useState } from 'react'

import { StatusBadge } from '@/components/checkout/status-badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Charge, ChargeStatus, Collaborator } from '@/lib/fixtures'
import { formatBRL, formatDateTime, statusLabel } from '@/lib/format'

const ALL = 'all'

function dayKey(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

export function ChargesTable({
  charges,
  collaborators,
  showCollaboratorFilter,
}: {
  charges: Charge[]
  collaborators: Collaborator[]
  showCollaboratorFilter: boolean
}) {
  const [collab, setCollab] = useState(ALL)
  const [status, setStatus] = useState<ChargeStatus | typeof ALL>(ALL)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const bySlug = useMemo(() => new Map(collaborators.map((c) => [c.slug, c])), [collaborators])

  const rows = useMemo(
    () =>
      charges.filter((c) => {
        if (collab !== ALL && c.collaboratorSlug !== collab) return false
        if (status !== ALL && c.status !== status) return false
        const d = dayKey(c.createdAt)
        if (from && d < from) return false
        if (to && d > to) return false
        return true
      }),
    [charges, collab, status, from, to],
  )

  const total = rows.reduce((s, c) => s + c.amountCents, 0)
  const paid = rows.filter((c) => c.status === 'paid').reduce((s, c) => s + c.amountCents, 0)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        {showCollaboratorFilter ? (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Colaborador</Label>
            <Select value={collab} onValueChange={setCollab}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                {collaborators.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ChargeStatus | typeof ALL)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              {(Object.keys(statusLabel) as ChargeStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabel[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="from" className="text-xs text-muted-foreground">
            De
          </Label>
          <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="to" className="text-xs text-muted-foreground">
            Até
          </Label>
          <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 px-1 text-sm text-muted-foreground">
        <span>
          {rows.length} cobrança{rows.length === 1 ? '' : 's'}
        </span>
        <span>
          Total gerado: <strong className="text-foreground">{formatBRL(total)}</strong>
        </span>
        <span>
          Confirmado: <strong className="text-primary">{formatBRL(paid)}</strong>
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/50 p-10 text-center">
          <Inbox className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <p className="mt-3 font-medium">Nenhuma cobrança encontrada</p>
          <p className="text-sm text-muted-foreground">Ajuste os filtros ou gere um novo PIX.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                {showCollaboratorFilter ? <TableHead>Colaborador</TableHead> : null}
                <TableHead>Recebedor</TableHead>
                <TableHead>Transação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Link</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => {
                const col = bySlug.get(c.collaboratorSlug)
                return (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(c.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {c.customerName}
                      {c.createdBy === 'admin' ? (
                        <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase">
                          admin
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right font-display font-semibold tabular-nums">
                      {formatBRL(c.amountCents)}
                    </TableCell>
                    {showCollaboratorFilter ? <TableCell>{col?.title ?? '—'}</TableCell> : null}
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {col?.recipientId ?? '—'}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {c.transactionId}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell>
                      <Link
                        to="/pagar/$chargeId"
                        params={{ chargeId: c.id }}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        Link <ExternalLink className="size-3" aria-hidden />
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
