/**
 * Dados de exemplo da primeira etapa (superfície do produto).
 *
 * Tudo o que hoje vem daqui será substituído por dados reais do PostgreSQL
 * e da API V5 da Pagar.me nas próximas etapas (veja PLAN.md). Nenhuma
 * cobrança aqui é um PIX real: QR Code e copia e cola só existem quando a
 * Pagar.me os retorna.
 */

export type ChargeStatus = 'pending' | 'paid' | 'expired' | 'failed'

export type Collaborator = {
  id: string
  slug: string
  name: string
  title: string
  login: string
  recipientId: string
  splitPercent: number
  active: boolean
}

export type Charge = {
  id: string
  collaboratorSlug: string
  customerName: string
  customerDocument: string
  customerEmail: string
  customerPhone: string
  description: string
  amountCents: number
  status: ChargeStatus
  /** Preenchido pela Pagar.me (order/charge id). */
  transactionId: string
  /** Código copia e cola e URL do QR, exatamente como retornados pela Pagar.me. */
  pixCopyPaste?: string
  qrCodeUrl?: string
  createdAt: string
  expiresAt: string
  paidAt?: string
  createdBy: 'admin' | 'collaborator'
}

/** Recebedor principal: 1% de todas as cobranças. Fica somente no backend. */
export const PRINCIPAL_RECIPIENT = {
  id: 're_cmuykrmjuek7n0l9t05hndzls',
  label: 'Recebedor principal',
  splitPercent: 1,
}

export const PIX_EXPIRATION_MINUTES = 30

export const DEFAULT_DISPLAY_NAME = 'Checkout PIX'

export const collaborators: Collaborator[] = [
  {
    id: 'col_andre',
    slug: 'andre',
    name: 'ANDRE CICERO DA SILVA JUNIOR',
    title: 'PIX André',
    login: 'andre',
    recipientId: 're_cmvfm5b8b04sk0l9t74hfy2dq',
    splitPercent: 99,
    active: true,
  },
  {
    id: 'col_mariana',
    slug: 'mariana',
    name: 'MARIANA CAROLINE FERNANDES JACINTHO',
    title: 'PIX Mariana',
    login: 'mariana',
    recipientId: 're_cmvfmiz10085y0l9tre7vbfbm',
    splitPercent: 99,
    active: true,
  },
  {
    id: 'col_rodrigo',
    slug: 'rodrigo',
    name: 'Rodrigo Oliveira Lopes',
    title: 'PIX Rodrigo',
    login: 'rodrigo',
    recipientId: 're_cmvft1e190sdz0m9tij4qq22l',
    splitPercent: 99,
    active: true,
  },
  {
    id: 'col_thalwan',
    slug: 'thalwan',
    name: 'Thalwan Júnior Ribeiro Laturdes Vasconcelos',
    title: 'PIX Thalwan',
    login: 'thalwan',
    recipientId: 're_cmvg409fu2ra40l9tvm7e5kww',
    splitPercent: 99,
    active: true,
  },
]

/** Horário de Brasília (UTC-3) fixo, para que servidor e navegador gerem o mesmo valor. */
function iso(daysAgo: number, hour: number, minute = 0) {
  return new Date(Date.UTC(2026, 9, 20 - daysAgo, hour + 3, minute)).toISOString()
}

function plusMinutes(isoDate: string, minutes: number) {
  return new Date(new Date(isoDate).getTime() + minutes * 60_000).toISOString()
}

type Seed = [
  id: string,
  slug: string,
  customer: string,
  description: string,
  amountCents: number,
  status: ChargeStatus,
  daysAgo: number,
  hour: number,
  createdBy?: 'admin' | 'collaborator',
]

const seeds: Seed[] = [
  ['ch_demo_01', 'andre', 'Juliana Pereira Costa', 'Consultoria mensal', 100000, 'paid', 0, 9],
  ['ch_demo_02', 'mariana', 'Carlos Henrique Souza', 'Sessão de mentoria', 45000, 'pending', 0, 10],
  ['ch_demo_03', 'rodrigo', 'Fernanda Lima Rocha', 'Serviço avulso', 25990, 'paid', 0, 11],
  ['ch_demo_04', 'thalwan', 'Marcos Vinícius Alves', 'Pacote trimestral', 189000, 'pending', 0, 12, 'admin'],
  ['ch_demo_05', 'andre', 'Patrícia Gomes', 'Sinal de contrato', 50000, 'expired', 1, 15],
  ['ch_demo_06', 'mariana', 'Ricardo Nunes', 'Atendimento', 32000, 'paid', 1, 16],
  ['ch_demo_07', 'rodrigo', 'Aline Martins', 'Renovação anual', 240000, 'paid', 2, 9],
  ['ch_demo_08', 'thalwan', 'Bruno Carvalho', 'Serviço avulso', 15000, 'failed', 2, 14],
  ['ch_demo_09', 'andre', 'Camila Ribeiro', 'Consultoria mensal', 100000, 'paid', 3, 10, 'admin'],
  ['ch_demo_10', 'mariana', 'Diego Fernandes', 'Sessão de mentoria', 45000, 'paid', 4, 11],
  ['ch_demo_11', 'rodrigo', 'Eduarda Santos', 'Serviço avulso', 7990, 'expired', 5, 18],
  ['ch_demo_12', 'thalwan', 'Gustavo Moreira', 'Pacote mensal', 69000, 'paid', 6, 13],
]

export const initialCharges: Charge[] = seeds.map(
  ([id, slug, customer, description, amountCents, status, daysAgo, hour, createdBy]) => {
    const createdAt = iso(daysAgo, hour, 12)
    return {
      id,
      collaboratorSlug: slug,
      customerName: customer,
      customerDocument: '000.000.000-00',
      customerEmail: 'cliente@exemplo.com.br',
      customerPhone: '(11) 90000-0000',
      description,
      amountCents,
      status,
      transactionId: `or_exemplo_${id.slice(-2)}`,
      createdAt,
      // Pendentes de exemplo ficam abertas por mais tempo para a prévia mostrar a contagem.
      expiresAt: plusMinutes(createdAt, status === 'pending' ? 3 * 24 * 60 : PIX_EXPIRATION_MINUTES),
      paidAt: status === 'paid' ? plusMinutes(createdAt, 4) : undefined,
      createdBy: createdBy ?? 'collaborator',
    }
  },
)

export type AuditEntry = {
  id: string
  at: string
  actor: string
  action: string
}

export const initialAudit: AuditEntry[] = [
  { id: 'au_1', at: iso(0, 8, 2), actor: 'admin', action: 'Validou os 5 recebedores na Pagar.me' },
  { id: 'au_2', at: iso(1, 19, 40), actor: 'admin', action: 'Alterou o nome de exibição do checkout' },
  { id: 'au_3', at: iso(2, 9, 5), actor: 'admin', action: 'Criou o acesso de Thalwan' },
]
