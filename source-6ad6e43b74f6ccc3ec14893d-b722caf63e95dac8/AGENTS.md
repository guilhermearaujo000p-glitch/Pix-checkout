# AGENTS.md

Guia para agentes e desenvolvedores que trabalham neste projeto.

## Visão geral

Checkout PIX privado (pt-BR) com painel administrativo, quatro geradores
individuais e split automático pela API V5 da Pagar.me (99% colaborador · 1%
recebedor principal `re_cmuykrmjuek7n0l9t05hndzls`). **Continue pelo roteiro em
[PLAN.md](PLAN.md)** — a Etapa 1 (superfície do produto) está concluída; a
próxima é a Etapa 2 (banco de dados).

Restrições do produto (não negociáveis):

- Não usar o nome "JVC PAY". Sem loja, catálogo ou landing page — `/` é o login.
- Nunca gerar PIX fictício nem alterar o payload PIX. QR Code e copia e cola
  vêm exclusivamente da resposta da Pagar.me (`qr_code`, `qr_code_url`).
- Split, IDs de recebedores e porcentagens são definidos só no servidor; o
  cliente nunca os envia. Colaboradores não alteram configurações financeiras.
- "Nome de exibição do checkout" é apenas visual, editável só pelo admin, e não
  deve ser apresentado como identificação bancária oficial.
- Pagamento só é "pago" após confirmação oficial da Pagar.me (webhook + reconsulta).
- Segredos apenas em variáveis de ambiente (veja `.env.example`).

## Stack

TanStack Start (React 19, TanStack Router, Vite), TypeScript estrito, Tailwind
CSS 4 com variáveis de tema em `src/styles.css` (fundo preto/cinza-escuro,
primária verde), shadcn/ui em `src/components/ui`, lucide-react, sonner.
Persistência planejada: Netlify Database (Postgres) + Drizzle (`db/schema.ts`).

## Estrutura

```
src/
├── lib/
│   ├── fixtures.ts       # Dados de exemplo (colaboradores, recebedores, cobranças). Trocar pelo banco.
│   ├── preview-store.ts  # Estado da prévia (useSyncExternalStore + localStorage). Única camada a substituir por server functions.
│   └── format.ts         # BRL, datas (America/Sao_Paulo), máscaras/validação de CPF, cálculo do split.
├── components/checkout/
│   ├── app-shell.tsx     # Cabeçalho/navegação por perfil, <Protected> (guarda de tela), PageHeader.
│   ├── pix-generator.tsx # Formulário GERAR PIX (zod), painel de split bloqueado, aviso de integração.
│   ├── charge-result.tsx # Resultado: QR, copia e cola, link, WhatsApp, contagem regressiva.
│   ├── charges-table.tsx # Histórico com filtros por colaborador, status e data.
│   ├── pix-qr.tsx        # Mostra a imagem oficial do QR ou um espaço reservado (nunca um QR falso).
│   └── brand.tsx, status-badge.tsx, use-countdown.ts
└── routes/
    ├── index.tsx              # Login
    ├── $slug.tsx              # Gerador do colaborador (/andre, /mariana, ...)
    ├── pagar.$chargeId.tsx    # Página pública do cliente
    ├── admin.tsx              # Layout protegido do admin (Outlet)
    └── admin.{index,geradores,cobrancas,colaboradores,configuracoes}.tsx
```

## Convenções e decisões

- Interface em português do Brasil; valores monetários sempre em centavos.
- Componentes leem dados apenas via `usePreview(selector)` e ações de
  `preview-store.ts`. Seletores devem retornar referências estáveis (ex.:
  `s.charges`) e derivar listas com `useMemo`, senão o `useSyncExternalStore` entra em loop.
- `localStorage`/`Date.now()` só dentro de `useEffect` (SSR). Datas de exemplo
  são fixas em UTC-3 para não divergir na hidratação.
- `<Protected>` é só a guarda visual da prévia; na Etapa 3 a autorização passa
  a ser aplicada em cada server function.
- Slugs reservados para colaboradores: `admin`, `pagar`, `api`, `login`.
- `netlify.toml` define cabeçalhos de segurança e `noindex` (checkout privado).

## Comandos

```bash
pnpm dev         # Vite na porta 3000 (ou netlify dev)
pnpm typecheck
pnpm lint
pnpm test
```

`src/routeTree.gen.ts` é gerado automaticamente — não editar.
