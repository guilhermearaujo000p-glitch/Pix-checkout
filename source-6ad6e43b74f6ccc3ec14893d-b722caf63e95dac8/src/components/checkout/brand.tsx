import { cn } from '@/lib/utils'

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_24px_-4px_var(--primary)]',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
        <path d="M12 2.5 21.5 12 12 21.5 2.5 12 12 2.5Zm0 4.2L6.7 12l5.3 5.3 5.3-5.3L12 6.7Z" />
      </svg>
    </span>
  )
}

export function Brand({ name, subtitle }: { name: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <BrandMark />
      <div className="leading-tight">
        <p className="font-display text-base font-semibold tracking-tight">{name}</p>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
    </div>
  )
}
