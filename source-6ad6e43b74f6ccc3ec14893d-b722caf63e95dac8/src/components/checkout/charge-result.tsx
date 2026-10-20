import { Check, Copy, Link2, MessageCircle, Timer } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { PixQr } from '@/components/checkout/pix-qr'
import { StatusBadge } from '@/components/checkout/status-badge'
import { formatCountdown, useCountdown } from '@/components/checkout/use-countdown'
import type { Charge } from '@/lib/fixtures'
import { formatBRL, paymentLink } from '@/lib/format'
import { cn } from '@/lib/utils'

export async function copyText(text: string, okMessage: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(okMessage)
  } catch {
    toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.')
  }
}

export function whatsappShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function ExpirationTimer({ expiresAt, status }: { expiresAt: string; status: Charge['status'] }) {
  const left = useCountdown(expiresAt)
  const ended = status !== 'pending' || left === 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-sm tabular-nums',
        ended ? 'text-muted-foreground' : left !== null && left < 300 ? 'text-warning' : 'text-foreground',
      )}
    >
      <Timer className="size-4" aria-hidden />
      {status === 'paid' ? 'Pago' : ended ? 'Expirado' : formatCountdown(left)}
    </span>
  )
}

/** Bloco do código copia e cola. Só habilita a cópia quando o código oficial existir. */
export function CopyPasteField({ code }: { code?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        PIX copia e cola
      </p>
      <div className="rounded-lg border bg-background/60 p-3 font-mono text-xs leading-relaxed break-all text-muted-foreground">
        {code ?? 'O código oficial aparece aqui quando a Pagar.me confirmar a criação da cobrança.'}
      </div>
      <Button
        size="lg"
        className="w-full font-semibold"
        disabled={!code}
        onClick={async () => {
          if (!code) return
          await copyText(code, 'Código PIX copiado')
          setCopied(true)
          window.setTimeout(() => setCopied(false), 2000)
        }}
      >
        {copied ? <Check /> : <Copy />}
        COPIAR PIX
      </Button>
    </div>
  )
}

export function ChargeResult({
  charge,
  displayName,
  collaboratorTitle,
}: {
  charge: Charge
  displayName: string
  collaboratorTitle: string
}) {
  const link = paymentLink(charge.id)
  const shareText = `${displayName} — pagamento de ${formatBRL(charge.amountCents)} via PIX.\nAcesse para pagar: ${link}`

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <p className="text-xs text-muted-foreground">
            {displayName} · {collaboratorTitle}
          </p>
          <p className="font-display text-3xl font-semibold tracking-tight">
            {formatBRL(charge.amountCents)}
          </p>
        </div>
        <StatusBadge status={charge.status} />
      </div>

      <div className="grid gap-6 p-5 md:grid-cols-[15rem_1fr]">
        <div className="flex flex-col items-center gap-3">
          <PixQr qrCodeUrl={charge.qrCodeUrl} />
          <ExpirationTimer expiresAt={charge.expiresAt} status={charge.status} />
        </div>

        <div className="space-y-5">
          <CopyPasteField code={charge.pixCopyPaste} />

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Cliente</dt>
              <dd className="font-medium">{charge.customerName}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Descrição</dt>
              <dd className="font-medium">{charge.description || '—'}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">Identificador da transação</dt>
              <dd className="font-mono text-xs break-all">{charge.transactionId}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">Link de pagamento</dt>
              <dd className="font-mono text-xs break-all text-primary">{link}</dd>
            </div>
          </dl>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="secondary" onClick={() => copyText(link, 'Link copiado')}>
              <Link2 />
              COPIAR LINK
            </Button>
            <Button
              asChild
              className="bg-[#25D366] text-[#08260f] hover:bg-[#25D366]/90"
            >
              <a href={whatsappShareUrl(shareText)} target="_blank" rel="noreferrer">
                <MessageCircle />
                COMPARTILHAR NO WHATSAPP
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
