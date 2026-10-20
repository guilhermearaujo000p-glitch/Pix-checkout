import { CheckCircle2, Clock3, TimerOff, XCircle } from 'lucide-react'

import type { ChargeStatus } from '@/lib/fixtures'
import { statusLabel } from '@/lib/format'
import { cn } from '@/lib/utils'

const styles: Record<ChargeStatus, string> = {
  paid: 'bg-primary/15 text-primary border-primary/30',
  pending: 'bg-warning/15 text-warning border-warning/30',
  expired: 'bg-muted text-muted-foreground border-border',
  failed: 'bg-destructive/15 text-destructive border-destructive/30',
}

const icons = {
  paid: CheckCircle2,
  pending: Clock3,
  expired: TimerOff,
  failed: XCircle,
}

export function StatusBadge({ status, className }: { status: ChargeStatus; className?: string }) {
  const Icon = icons[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        styles[status],
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {statusLabel[status]}
    </span>
  )
}
