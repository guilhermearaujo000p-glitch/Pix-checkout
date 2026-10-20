import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle2, Landmark, SearchX, ShieldCheck } from 'lucide-react'
import { useEffect } from 'react'

import { BrandMark } from '@/components/checkout/brand'
import { CopyPasteField, ExpirationTimer } from '@/components/checkout/charge-result'
import { PixQr } from '@/components/checkout/pix-qr'
import { StatusBadge } from '@/components/checkout/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBRL } from '@/lib/format'
import { loadSession, usePreview } from '@/lib/preview-store'

export const Route = createFileRoute('/pagar/$chargeId')({
  head: () => ({ meta: [{ title: 'Pagamento PIX' }] }),
  component: PaymentPage,
})

function PaymentPage() {
  const { chargeId } = Route.useParams()
  const loaded = usePreview((s) => s.sessionLoaded)
  const displayName = usePreview((s) => s.displayName)
  const charges = usePreview((s) => s.charges)
  const charge = charges.find((c) => c.id === chargeId)

  useEffect(() => loadSession(), [])

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(40rem_24rem_at_50%_-10%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent)]">
      <header className="mx-auto flex w-full max-w-lg items-center gap-3 px-4 pt-8">
        <BrandMark className="size-8" />
        <p className="font-display text-lg font-semibold tracking-tight">{displayName}</p>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        {!loaded ? (
          <div className="space-y-4 rounded-2xl border bg-card p-6">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="mx-auto aspect-square w-60" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : !charge ? (
          <div className="rounded-2xl border bg-card p-10 text-center">
            <SearchX className="mx-auto size-10 text-muted-foreground" aria-hidden />
            <h1 className="mt-4 font-display text-xl font-semibold">Cobrança não encontrada</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Confira o link recebido ou peça um novo link a quem enviou a cobrança.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="border-b p-6 text-center">
              <p className="text-sm text-muted-foreground">Valor a pagar</p>
              <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">
                {formatBRL(charge.amountCents)}
              </h1>
              {charge.description ? (
                <p className="mt-2 text-sm text-muted-foreground">{charge.description}</p>
              ) : null}
              <div className="mt-4 flex items-center justify-center gap-3">
                <StatusBadge status={charge.status} />
                <ExpirationTimer expiresAt={charge.expiresAt} status={charge.status} />
              </div>
            </div>

            {charge.status === 'paid' ? (
              <div className="p-10 text-center">
                <CheckCircle2 className="mx-auto size-14 text-primary" aria-hidden />
                <p className="mt-4 font-display text-xl font-semibold">Pagamento confirmado</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Confirmação recebida da Pagar.me. Você já pode fechar esta página.
                </p>
              </div>
            ) : charge.status === 'pending' ? (
              <div className="space-y-6 p-6">
                <div className="flex justify-center">
                  <PixQr qrCodeUrl={charge.qrCodeUrl} />
                </div>
                <ol className="space-y-1 text-sm text-muted-foreground">
                  <li>1. Abra o app do seu banco e escolha pagar com PIX.</li>
                  <li>2. Leia o QR Code ou cole o código copia e cola.</li>
                  <li>3. Confira os dados e confirme o pagamento.</li>
                </ol>
                <CopyPasteField code={charge.pixCopyPaste} />
              </div>
            ) : (
              <div className="p-10 text-center">
                <p className="font-display text-lg font-semibold">Esta cobrança não está mais disponível</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Solicite um novo link de pagamento a quem enviou a cobrança.
                </p>
              </div>
            )}

            <div className="space-y-2 border-t bg-background/40 p-5 text-xs text-muted-foreground">
              <p className="flex gap-2">
                <Landmark className="size-4 shrink-0" aria-hidden />
                “{displayName}” é apenas o nome de exibição desta página. O recebedor e a instituição
                oficiais aparecem no app do seu banco ao ler o código.
              </p>
              <p className="flex gap-2">
                <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden />
                Pagamento processado pela Pagar.me. O status é atualizado após a confirmação oficial.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
