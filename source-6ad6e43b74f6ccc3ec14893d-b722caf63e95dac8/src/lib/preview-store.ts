import { useSyncExternalStore } from 'react'

import {
  DEFAULT_DISPLAY_NAME,
  PIX_EXPIRATION_MINUTES,
  collaborators as seedCollaborators,
  initialAudit,
  initialCharges,
  type AuditEntry,
  type Charge,
  type Collaborator,
} from '@/lib/fixtures'

/**
 * Estado em memória do navegador para a prévia navegável.
 *
 * Substituído na Etapa 2+ por server functions que leem/escrevem no
 * PostgreSQL. Os componentes só usam os hooks e ações exportados daqui,
 * então a troca fica concentrada neste arquivo.
 */

export type Session =
  | { role: 'admin'; name: string }
  | { role: 'collaborator'; name: string; slug: string }

type State = {
  displayName: string
  collaborators: Collaborator[]
  charges: Charge[]
  audit: AuditEntry[]
  session: Session | null
  sessionLoaded: boolean
}

const initialState: State = {
  displayName: DEFAULT_DISPLAY_NAME,
  collaborators: seedCollaborators,
  charges: initialCharges,
  audit: initialAudit,
  session: null,
  sessionLoaded: false,
}

let state = initialState
const listeners = new Set<() => void>()
const SESSION_KEY = 'pix-checkout-preview-session'
const DATA_KEY = 'pix-checkout-preview-data'

function setState(patch: Partial<State>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
  if (state.sessionLoaded && ('displayName' in patch || 'collaborators' in patch || 'charges' in patch)) {
    try {
      window.localStorage.setItem(
        DATA_KEY,
        JSON.stringify({
          displayName: state.displayName,
          collaborators: state.collaborators,
          charges: state.charges.filter((c) => c.id.startsWith('ch_previa_')),
        }),
      )
    } catch {
      // armazenamento indisponível: a prévia segue apenas em memória
    }
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function usePreview<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(initialState),
  )
}

function log(action: string) {
  const actor = state.session?.role === 'admin' ? 'admin' : (state.session?.name ?? 'sistema')
  setState({
    audit: [
      { id: `au_${Date.now()}`, at: new Date().toISOString(), actor, action },
      ...state.audit,
    ],
  })
}

/* ---------- sessão ---------- */

/** Carrega sessão e dados da prévia do navegador. Chamar dentro de useEffect. */
export function loadSession() {
  if (state.sessionLoaded) return
  let session: Session | null = null
  const patch: Partial<State> = {}
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    session = raw ? (JSON.parse(raw) as Session) : null
    const data = window.localStorage.getItem(DATA_KEY)
    if (data) {
      const parsed = JSON.parse(data) as Pick<State, 'displayName' | 'collaborators' | 'charges'>
      patch.displayName = parsed.displayName
      patch.collaborators = parsed.collaborators
      patch.charges = [...parsed.charges, ...initialCharges]
    }
  } catch {
    session = null
  }
  state = { ...state, ...patch }
  setState({ session, sessionLoaded: true })
}

export function signIn(login: string): Session | null {
  const normalized = login.trim().toLowerCase()
  let session: Session | null = null
  if (normalized === 'admin') {
    session = { role: 'admin', name: 'Administrador' }
  } else {
    const c = state.collaborators.find((x) => x.login === normalized && x.active)
    if (c) session = { role: 'collaborator', name: c.title.replace('PIX ', ''), slug: c.slug }
  }
  if (session) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setState({ session, sessionLoaded: true })
  }
  return session
}

export function signOut() {
  window.localStorage.removeItem(SESSION_KEY)
  setState({ session: null })
}

/* ---------- configurações (somente admin) ---------- */

export function updateDisplayName(name: string) {
  setState({ displayName: name })
  log(`Alterou o nome de exibição do checkout para "${name}"`)
}

export function setCollaboratorActive(slug: string, active: boolean) {
  setState({
    collaborators: state.collaborators.map((c) => (c.slug === slug ? { ...c, active } : c)),
  })
  log(`${active ? 'Ativou' : 'Desativou'} o colaborador ${slug}`)
}

export function addCollaborator(input: Omit<Collaborator, 'id' | 'splitPercent' | 'active'>) {
  setState({
    collaborators: [
      ...state.collaborators,
      { ...input, id: `col_${input.slug}`, splitPercent: 99, active: true },
    ],
  })
  log(`Criou o acesso de ${input.title}`)
}

/* ---------- cobranças ---------- */

export type NewChargeInput = {
  collaboratorSlug: string
  amountCents: number
  customerName: string
  customerDocument: string
  customerEmail: string
  customerPhone: string
  description: string
}

export function createPreviewCharge(input: NewChargeInput): Charge {
  const now = new Date()
  const id = `ch_previa_${now.getTime().toString(36)}`
  const charge: Charge = {
    ...input,
    id,
    status: 'pending',
    transactionId: 'aguardando Pagar.me',
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + PIX_EXPIRATION_MINUTES * 60_000).toISOString(),
    createdBy: state.session?.role === 'admin' ? 'admin' : 'collaborator',
  }
  setState({ charges: [charge, ...state.charges] })
  return charge
}
