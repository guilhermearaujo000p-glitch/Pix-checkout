import { QrCode } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Área do QR Code. Quando `qrCodeUrl` existir (retornado pela Pagar.me),
 * a imagem oficial é exibida sem qualquer alteração. Sem ela, mostra apenas
 * um espaço reservado — nunca um QR fictício.
 */
export function PixQr({ qrCodeUrl, className }: { qrCodeUrl?: string; className?: string }) {
  if (qrCodeUrl) {
    return (
      <img
        src={qrCodeUrl}
        alt="QR Code PIX"
        className={cn('aspect-square w-full max-w-60 rounded-xl bg-white p-3', className)}
      />
    )
  }
  return (
    <div
      className={cn(
        'relative grid aspect-square w-full max-w-60 place-items-center overflow-hidden rounded-xl border border-dashed border-primary/40 bg-[repeating-linear-gradient(45deg,transparent_0_10px,color-mix(in_oklch,var(--primary)_6%,transparent)_10px_20px)]',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-2 px-6 text-center">
        <QrCode className="size-10 text-primary" aria-hidden />
        <p className="text-sm font-medium">QR Code oficial</p>
        <p className="text-xs text-muted-foreground">
          Exibido aqui assim que a Pagar.me retornar a cobrança.
        </p>
      </div>
    </div>
  )
}
