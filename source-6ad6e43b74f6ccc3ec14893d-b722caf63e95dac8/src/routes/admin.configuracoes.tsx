import { createFileRoute } from '@tanstack/react-router'
import { Circle, Lock, Save, Store } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/checkout/app-shell'
import { BrandMark } from '@/components/checkout/brand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PRINCIPAL_RECIPIENT } from '@/lib/fixtures'
import { updateDisplayName, usePreview } from '@/lib/preview-store'

export const Route = createFileRoute('/admin/configuracoes')({
  component: AdminSettings,
})

const readiness = [
  'Credenciais da Pagar.me (chave secreta no servidor)',
  'Recebedores validados na API',
  'Split habilitado na conta',
  'Responsabilidade pelas taxas configurada',
  'Webhook cadastrado e assinatura verificada',
  'Cálculo das porcentagens conferido',
  'PIX de teste gerado e confirmado',
]

function AdminSettings() {
  const displayName = usePreview((s) => s.displayName)
  const collaborators = usePreview((s) => s.collaborators)
  const [draft, setDraft] = useState(displayName)

  useEffect(() => setDraft(displayName), [displayName])

  function onSave(e: FormEvent) {
    e.preventDefault()
    const name = draft.trim().replace(/\s+/g, ' ')
    if (name.length < 2 || name.length > 40) {
      toast.error('Use entre 2 e 40 caracteres.')
      return
    }
    updateDisplayName(name)
    toast.success('Nome de exibição aplicado aos quatro checkouts')
  }

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Somente o administrador pode alterar estas configurações."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Store className="size-5 text-primary" aria-hidden />
            <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
              Nome de exibição do checkout
            </h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Nome comercial exibido no painel, nos geradores e na página de pagamento do cliente.
            É apenas visual: código PIX, QR Code, recebedores, split e a identificação oficial da
            instituição continuam vindo da Pagar.me.
          </p>
          <form onSubmit={onSave} className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Nome de exibição</Label>
              <Input
                id="display-name"
                value={draft}
                maxLength={40}
                onChange={(e) => setDraft(e.target.value)}
              />
            </div>
            <div className="rounded-xl border bg-background/60 p-4">
              <p className="mb-3 text-xs text-muted-foreground">Prévia na página do cliente</p>
              <div className="flex items-center gap-3">
                <BrandMark className="size-8" />
                <span className="font-display text-lg font-semibold">{draft || '—'}</span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Aplicado em: {collaborators.map((c) => c.title).join(' · ')}
              </p>
            </div>
            <Button type="submit" disabled={draft.trim() === displayName}>
              <Save /> Salvar nome
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Lock className="size-5 text-primary" aria-hidden />
            <h2 className="font-display text-lg font-semibold">Recebedores e split</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Definidos no servidor e aplicados em toda cobrança. Colaboradores não podem alterar.
          </p>
          <ul className="mt-5 divide-y rounded-xl border">
            <li className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{PRINCIPAL_RECIPIENT.label}</p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">
                  {PRINCIPAL_RECIPIENT.id}
                </p>
              </div>
              <span className="font-display font-semibold text-primary">
                {PRINCIPAL_RECIPIENT.splitPercent}%
              </span>
            </li>
            {collaborators.map((c) => (
              <li key={c.slug} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {c.recipientId}
                  </p>
                </div>
                <span className="font-display font-semibold">{c.splitPercent}%</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border bg-card p-5 sm:p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">Ativação de cobranças reais</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cobranças reais só são liberadas quando todos os itens forem validados na Pagar.me V5.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {readiness.map((item) => (
              <li key={item} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                <Circle className="size-4 text-warning" aria-hidden />
                <span className="flex-1">{item}</span>
                <span className="text-xs text-muted-foreground">Pendente</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
