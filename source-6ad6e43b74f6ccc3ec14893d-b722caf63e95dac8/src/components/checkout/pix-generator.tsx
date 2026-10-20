import { Info, Loader2, Lock, Zap } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { z } from 'zod'

import { ChargeResult } from '@/components/checkout/charge-result'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Charge, Collaborator } from '@/lib/fixtures'
import { PRINCIPAL_RECIPIENT } from '@/lib/fixtures'
import {
  formatBRL,
  isValidCPF,
  maskCPF,
  maskPhone,
  onlyDigits,
  parseBRLToCents,
  splitPreview,
} from '@/lib/format'
import { createPreviewCharge, usePreview } from '@/lib/preview-store'

const schema = z.object({
  amountCents: z
    .number({ message: 'Informe um valor válido' })
    .int()
    .min(100, 'Valor mínimo de R$ 1,00')
    .max(10_000_000, 'Valor máximo de R$ 100.000,00'),
  customerName: z
    .string()
    .trim()
    .min(5, 'Informe o nome completo')
    .refine((v) => v.split(/\s+/).length >= 2, 'Informe nome e sobrenome'),
  customerDocument: z.string().refine(isValidCPF, 'CPF inválido'),
  customerEmail: z.email('E-mail inválido'),
  customerPhone: z
    .string()
    .refine((v) => onlyDigits(v).length >= 10, 'Telefone com DDD'),
  description: z.string().trim().max(120, 'Máximo de 120 caracteres'),
})

type FieldErrors = Partial<Record<keyof z.infer<typeof schema>, string>>

const empty = {
  amount: '',
  customerName: '',
  customerDocument: '',
  customerEmail: '',
  customerPhone: '',
  description: '',
}

export function PixGenerator({ collaborator }: { collaborator: Collaborator }) {
  const displayName = usePreview((s) => s.displayName)
  const [values, setValues] = useState(empty)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<Charge | null>(null)

  const cents = parseBRLToCents(values.amount) ?? 0
  const split = splitPreview(cents)

  const set = (key: keyof typeof empty, value: string) =>
    setValues((v) => ({ ...v, [key]: value }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = schema.safeParse({
      amountCents: parseBRLToCents(values.amount) ?? Number.NaN,
      customerName: values.customerName,
      customerDocument: values.customerDocument,
      customerEmail: values.customerEmail.trim(),
      customerPhone: values.customerPhone,
      description: values.description,
    })
    if (!parsed.success) {
      const next: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof FieldErrors
        next[k] ??= issue.message
      }
      setErrors(next)
      return
    }
    setErrors({})
    setSubmitting(true)
    // Etapa 4: chamada à Netlify Function que cria o pedido PIX com split na Pagar.me.
    await new Promise((r) => setTimeout(r, 600))
    setResult(createPreviewCharge({ ...parsed.data, collaboratorSlug: collaborator.slug }))
    setSubmitting(false)
  }

  if (!collaborator.active) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center">
        <Lock className="mx-auto size-8 text-muted-foreground" aria-hidden />
        <p className="mt-3 font-medium">Este gerador está desativado.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          O administrador pode reativá-lo em Colaboradores.
        </p>
      </div>
    )
  }

  if (result) {
    return (
      <div className="space-y-4">
        <ChargeResult
          charge={result}
          displayName={displayName}
          collaboratorTitle={collaborator.title}
        />
        <PreviewNotice />
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => {
            setResult(null)
            setValues(empty)
          }}
        >
          Gerar nova cobrança
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-2xl border bg-card p-5 sm:p-6">
        <Field label="Valor (R$)" error={errors.amountCents} htmlFor="amount">
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-display text-xl text-muted-foreground">
              R$
            </span>
            <Input
              id="amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00"
              className="h-16 pl-14 font-display text-3xl font-semibold md:text-3xl"
              value={values.amount}
              onChange={(e) => set('amount', e.target.value.replace(/[^\d,.]/g, ''))}
              aria-invalid={!!errors.amountCents}
            />
          </div>
        </Field>

        <Field label="Nome completo do cliente" error={errors.customerName} htmlFor="name">
          <Input
            id="name"
            autoComplete="off"
            placeholder="Ex.: Maria da Silva Santos"
            value={values.customerName}
            onChange={(e) => set('customerName', e.target.value)}
            aria-invalid={!!errors.customerName}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="CPF" error={errors.customerDocument} htmlFor="cpf">
            <Input
              id="cpf"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={values.customerDocument}
              onChange={(e) => set('customerDocument', maskCPF(e.target.value))}
              aria-invalid={!!errors.customerDocument}
            />
          </Field>
          <Field label="Telefone" error={errors.customerPhone} htmlFor="phone">
            <Input
              id="phone"
              inputMode="tel"
              placeholder="(11) 90000-0000"
              value={values.customerPhone}
              onChange={(e) => set('customerPhone', maskPhone(e.target.value))}
              aria-invalid={!!errors.customerPhone}
            />
          </Field>
        </div>

        <Field label="E-mail" error={errors.customerEmail} htmlFor="email">
          <Input
            id="email"
            type="email"
            placeholder="cliente@email.com"
            value={values.customerEmail}
            onChange={(e) => set('customerEmail', e.target.value)}
            aria-invalid={!!errors.customerEmail}
          />
        </Field>

        <Field label="Descrição do pagamento" error={errors.description} htmlFor="desc">
          <Textarea
            id="desc"
            rows={2}
            placeholder="Ex.: Serviço prestado em outubro"
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            aria-invalid={!!errors.description}
          />
        </Field>

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          CPF, e-mail e telefone são exigidos pela Pagar.me para cobranças PIX.
        </p>

        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="h-14 w-full text-base font-bold tracking-wide shadow-[0_8px_30px_-8px_var(--primary)]"
        >
          {submitting ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Zap />}
          GERAR PIX
        </Button>
      </form>

      <aside className="space-y-4">
        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display font-semibold">Split automático</p>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="size-3" aria-hidden /> Definido pelo sistema
            </span>
          </div>
          <SplitRow
            label={collaborator.title}
            sub={collaborator.recipientId}
            percent={collaborator.splitPercent}
            cents={split.collaborator}
          />
          <div className="my-3 h-px bg-border" />
          <SplitRow
            label={PRINCIPAL_RECIPIENT.label}
            sub="Recebedor da plataforma"
            percent={PRINCIPAL_RECIPIENT.splitPercent}
            cents={split.principal}
          />
          <p className="mt-4 text-xs text-muted-foreground">
            Valores brutos, antes das taxas da Pagar.me.
          </p>
        </div>
        <PreviewNotice />
      </aside>
    </div>
  )
}

function SplitRow({
  label,
  sub,
  percent,
  cents,
}: {
  label: string
  sub: string
  percent: number
  cents: number
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="truncate font-mono text-[11px] text-muted-foreground">{sub}</p>
      </div>
      <div className="text-right">
        <p className="font-display text-sm font-semibold tabular-nums">{formatBRL(cents)}</p>
        <p className="text-xs text-primary">{percent}%</p>
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  htmlFor,
  children,
}: {
  label: string
  error?: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

export function PreviewNotice() {
  return (
    <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-xs leading-relaxed text-warning">
      <p className="font-semibold">Integração Pagar.me em ativação</p>
      <p className="mt-1 text-warning/80">
        Esta versão registra a cobrança apenas na prévia. QR Code e copia e cola oficiais passam a
        ser exibidos quando a integração V5 for ativada — nenhum PIX é gerado artificialmente.
      </p>
    </div>
  )
}
