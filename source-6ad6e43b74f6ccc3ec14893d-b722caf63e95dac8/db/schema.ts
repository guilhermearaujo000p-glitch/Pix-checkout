import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

/**
 * Esquema do Netlify Database (Postgres). Valores monetários sempre em
 * centavos (inteiros). Recebedores e porcentagens do split vivem só aqui e
 * nunca são aceitos do cliente.
 */

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow()

/** Recebedores da Pagar.me (id oficial `re_...`). */
export const recipients = pgTable('recipients', {
  id: text().primaryKey(),
  label: text().notNull(),
  kind: text({ enum: ['principal', 'collaborator'] }).notNull(),
  /** Preenchido quando `GET /recipients/{id}` confirmar o recebedor ativo (Etapa 4). */
  validatedAt: timestamp('validated_at', { withTimezone: true }),
  createdAt: createdAt(),
})

/** Configuração única do checkout (linha id = 1). */
export const checkoutSettings = pgTable(
  'checkout_settings',
  {
    id: integer().primaryKey().default(1),
    /** Nome de exibição: apenas visual, nunca identificação bancária. */
    displayName: text('display_name').notNull(),
    principalRecipientId: text('principal_recipient_id')
      .notNull()
      .references(() => recipients.id),
    principalSplitPercent: integer('principal_split_percent').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('checkout_settings_singleton', sql`${t.id} = 1`),
    check(
      'checkout_settings_principal_percent',
      sql`${t.principalSplitPercent} between 0 and 100`,
    ),
  ],
)

export const collaborators = pgTable(
  'collaborators',
  {
    id: serial().primaryKey(),
    slug: text().notNull().unique(),
    name: text().notNull(),
    title: text().notNull(),
    recipientId: text('recipient_id')
      .notNull()
      .references(() => recipients.id),
    /** Porcentagem do colaborador; o principal recebe a de `checkout_settings`. */
    splitPercent: integer('split_percent').notNull(),
    active: boolean().notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [check('collaborators_split_percent', sql`${t.splitPercent} between 0 and 100`)],
)

export const users = pgTable(
  'users',
  {
    id: serial().primaryKey(),
    login: text().notNull().unique(),
    /** scrypt; nulo = acesso ainda sem senha definida pelo administrador. */
    passwordHash: text('password_hash'),
    role: text({ enum: ['admin', 'collaborator'] }).notNull(),
    collaboratorId: integer('collaborator_id').references(() => collaborators.id),
    name: text().notNull(),
    active: boolean().notNull().default(true),
    passwordChangedAt: timestamp('password_changed_at', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    check(
      'users_role_collaborator',
      sql`(${t.role} = 'admin' and ${t.collaboratorId} is null) or (${t.role} = 'collaborator' and ${t.collaboratorId} is not null)`,
    ),
    uniqueIndex('users_collaborator_unique').on(t.collaboratorId),
  ],
)

/** Sessões no servidor. O cookie guarda só o token; aqui fica o HMAC dele. */
export const sessions = pgTable(
  'sessions',
  {
    id: serial().primaryKey(),
    tokenHash: text('token_hash').notNull().unique(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ip: text(),
    userAgent: text('user_agent'),
    createdAt: createdAt(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
)

/** Tentativas de login para limitar força bruta por login e por IP. */
export const loginAttempts = pgTable(
  'login_attempts',
  {
    id: serial().primaryKey(),
    login: text().notNull(),
    ip: text().notNull(),
    success: boolean().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index('login_attempts_login_idx').on(t.login, t.createdAt),
    index('login_attempts_ip_idx').on(t.ip, t.createdAt),
  ],
)

export const charges = pgTable(
  'charges',
  {
    /** Identificador público e não sequencial usado no link /pagar/:id. */
    id: text().primaryKey(),
    collaboratorId: integer('collaborator_id')
      .notNull()
      .references(() => collaborators.id),
    createdByUserId: integer('created_by_user_id')
      .notNull()
      .references(() => users.id),
    amountCents: integer('amount_cents').notNull(),
    customerName: text('customer_name').notNull(),
    customerDocument: text('customer_document').notNull(),
    customerEmail: text('customer_email').notNull(),
    customerPhone: text('customer_phone').notNull(),
    description: text().notNull().default(''),
    status: text({ enum: ['pending', 'paid', 'expired', 'failed'] })
      .notNull()
      .default('pending'),
    /** Cópia do split no momento da criação (auditoria). */
    collaboratorRecipientId: text('collaborator_recipient_id').notNull(),
    collaboratorSplitPercent: integer('collaborator_split_percent').notNull(),
    principalRecipientId: text('principal_recipient_id').notNull(),
    principalSplitPercent: integer('principal_split_percent').notNull(),
    idempotencyKey: text('idempotency_key').notNull().unique(),
    pagarmeOrderId: text('pagarme_order_id').unique(),
    pagarmeChargeId: text('pagarme_charge_id'),
    /** Exatamente como retornados pela Pagar.me — nunca gerados ou alterados aqui. */
    qrCode: text('qr_code'),
    qrCodeUrl: text('qr_code_url'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('charges_amount_positive', sql`${t.amountCents} > 0`),
    check(
      'charges_split_total',
      sql`${t.collaboratorSplitPercent} + ${t.principalSplitPercent} = 100`,
    ),
    index('charges_collaborator_idx').on(t.collaboratorId, t.createdAt),
    index('charges_status_idx').on(t.status),
  ],
)

/** Eventos recebidos da Pagar.me (idempotência pelo id do evento). */
export const webhookEvents = pgTable('webhook_events', {
  id: text().primaryKey(),
  type: text().notNull(),
  payload: jsonb().notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
})

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: serial().primaryKey(),
    actorUserId: integer('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    actorLabel: text('actor_label').notNull(),
    action: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('audit_logs_created_idx').on(t.createdAt)],
)
