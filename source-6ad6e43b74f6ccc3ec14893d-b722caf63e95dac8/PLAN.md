# Roteiro do produto — Checkout PIX

Checkout PIX privado com painel administrativo, quatro geradores individuais e
split automático pela API V5 da Pagar.me (99% colaborador · 1% recebedor
principal). O trabalho está dividido em etapas pequenas e independentes.

## Etapa 1 — Superfície do produto ✅

Todas as telas navegáveis, com dados de exemplo concentrados em
`src/lib/fixtures.ts` e `src/lib/preview-store.ts`.

- Login (`/`) com redirecionamento por perfil
- Geradores individuais `/andre`, `/mariana`, `/rodrigo`, `/thalwan` (formulário, split
  bloqueado, resultado com QR, copia e cola, link, WhatsApp, histórico próprio)
- Página pública de pagamento `/pagar/:id` (sem login)
- Painel: visão geral, geradores, cobranças com filtros, colaboradores, configurações
- "Nome de exibição do checkout" aplicado a todas as telas
- Nenhum PIX fictício: QR e copia e cola aparecem apenas quando vierem da Pagar.me

## Etapa 2 — Banco de dados (Netlify Database + Drizzle)

- `db/schema.ts` com: `users`, `admins`, `collaborators`, `recipients`,
  `split_configs`, `checkout_settings` (nome de exibição), `charges`,
  `transactions`, `webhook_events`, `audit_logs`
- Migrações geradas com `drizzle-kit generate`
- Seed: recebedor principal `re_cmuykrmjuek7n0l9t05hndzls` (1%) e os quatro
  colaboradores com seus recebedores (99%)
- Valores monetários sempre em centavos (inteiros)

## Etapa 3 — Autenticação e permissões

- Login com senha em hash forte (argon2id ou scrypt), sessão em cookie
  `httpOnly`/`Secure`/`SameSite=Strict` assinado, expiração e logout no servidor
- Limite de tentativas de login
- Toda server function verifica perfil: admin vê tudo; colaborador só acessa o
  próprio gerador e as próprias cobranças (filtro por `collaborator_id` no servidor)
- Admin cria acessos, redefine senhas, ativa/desativa colaboradores
- Trocar `preview-store.ts` por server functions; remover os acessos da prévia do login

## Etapa 4 — Integração Pagar.me V5

- Cliente HTTP só no servidor (`PAGARME_SECRET_KEY` via variável de ambiente)
- Validação: `GET /recipients/{id}` para os cinco recebedores, status ativo e split habilitado
- Criação de cobrança: `POST /orders` com `payments[].payment_method = "pix"`,
  `pix.expires_in` e `split` com dois recebedores (`type: "percentage"`, 99 e 1),
  montado exclusivamente no backend a partir do banco — o cliente nunca envia
  recebedor ou porcentagem
- Salvar `qr_code` e `qr_code_url` exatamente como retornados (sem alterar payload)
- `idempotency-key` por cobrança; tratamento de erros da API com mensagens claras
- Chave de segurança `PAGARME_LIVE_ENABLED`: cobranças reais só após o checklist
- **Decisão pendente:** quem arca com as taxas (`liable`, `charge_processing_fee`,
  `charge_remainder_fee`). Sugestão: colaborador (99%) responsável pela taxa e pelo resto

## Etapa 5 — Webhooks e atualização de status

- Função `/api/webhooks/pagarme` com verificação de autenticidade (Basic Auth
  configurado no painel Pagar.me) e registro em `webhook_events` (idempotência por id do evento)
- Ao receber `order.paid` / `charge.paid`, reconsultar o pedido na API antes de
  marcar como pago — nunca aprovar sem confirmação oficial
- Expiração e falhas (`charge.payment_failed`, `order.canceled`)
- Página do cliente e gerador atualizam o status automaticamente (polling leve)

## Etapa 6 — Configurações financeiras e histórico

- Nome de exibição persistido em `checkout_settings`
- Edição de porcentagens do split pelo admin, com confirmação e log de auditoria
- Histórico com filtros (colaborador, data, status) e paginação no servidor
- Totais por colaborador calculados no banco

## Etapa 7 — Validação antes de ativar cobranças reais

Checklist em sandbox e depois em produção: credenciais, recebedores, split,
permissões, webhooks, cálculo das porcentagens, geração de PIX e confirmação de
pagamento. Testes automatizados de split, permissões e webhook.
