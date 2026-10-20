import type { ChargeStatus } from '@/lib/fixtures'
import { PRINCIPAL_RECIPIENT } from '@/lib/fixtures'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatBRL(cents: number) {
  return brl.format(cents / 100)
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** "1.234,56" ou "1234,56" → centavos. Retorna null se inválido. */
export function parseBRLToCents(value: string): number | null {
  const clean = value.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.')
  if (!clean) return null
  const n = Number(clean)
  if (!Number.isFinite(n)) return null
  return Math.round(n * 100)
}

/**
 * Valores brutos do split (antes das taxas). O backend usará a mesma regra:
 * 1% para o principal, o restante para o colaborador.
 */
export function splitPreview(amountCents: number) {
  const principal = Math.round((amountCents * PRINCIPAL_RECIPIENT.splitPercent) / 100)
  return { principal, collaborator: amountCents - principal }
}

export const statusLabel: Record<ChargeStatus, string> = {
  pending: 'Aguardando pagamento',
  paid: 'Pago',
  expired: 'Expirado',
  failed: 'Falhou',
}

export function onlyDigits(v: string) {
  return v.replace(/\D/g, '')
}

export function maskCPF(v: string) {
  const d = onlyDigits(v).slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function maskPhone(v: string) {
  const d = onlyDigits(v).slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

export function isValidCPF(v: string) {
  const d = onlyDigits(v)
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  const calc = (len: number) => {
    let sum = 0
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i)
    const r = (sum * 10) % 11
    return r === 10 ? 0 : r
  }
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10])
}

export function paymentLink(chargeId: string) {
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  return `${origin}/pagar/${chargeId}`
}
