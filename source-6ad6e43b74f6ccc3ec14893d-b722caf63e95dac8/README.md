# Checkout PIX

Checkout PIX privado com painel administrativo, geradores individuais por
colaborador e split automático pela API V5 da Pagar.me: 99% para o colaborador
vinculado ao checkout e 1% para o recebedor principal.

Não é uma loja nem uma landing page — a página inicial é o login.

## Telas

| Rota | Quem acessa | O que faz |
| --- | --- | --- |
| `/` | todos | Login |
| `/andre`, `/mariana`, `/rodrigo`, `/thalwan` | o colaborador e o admin | Gerador PIX + histórico próprio |
| `/pagar/:id` | cliente (sem login) | Valor, QR Code, copia e cola, status, tempo restante |
| `/admin` | admin | Totais, totais por colaborador, últimas cobranças, auditoria |
| `/admin/geradores` | admin | Gerar PIX em nome de qualquer colaborador |
| `/admin/cobrancas` | admin | Histórico completo com filtros |
| `/admin/colaboradores` | admin | Criar acessos, ativar/desativar, recebedores |
| `/admin/configuracoes` | admin | Nome de exibição do checkout, recebedores, checklist de ativação |

## Tecnologias

React 19 + TypeScript, TanStack Start/Router, Tailwind CSS 4, componentes
shadcn/ui, Netlify Functions, Netlify Database (PostgreSQL) com Drizzle e API
V5 da Pagar.me.

## Rodando localmente

```bash
pnpm install
cp .env.example .env   # preencha somente em desenvolvimento
netlify dev            # ou: pnpm dev
```

Na prévia atual, entre com `admin`, `andre`, `mariana`, `rodrigo` ou `thalwan`
(qualquer senha). Esses acessos são substituídos por login real na Etapa 3.

## Variáveis de ambiente

Veja `.env.example`. A chave secreta da Pagar.me fica somente nas variáveis de
ambiente do servidor na Netlify e nunca é enviada ao navegador.

## Estado atual e roteiro

Todas as telas estão prontas e navegáveis com dados de exemplo. As próximas
etapas — banco de dados, autenticação, integração Pagar.me com split, webhooks
e validação para cobranças reais — estão descritas em [PLAN.md](PLAN.md).
Enquanto a integração não estiver ativa, nenhum QR Code ou código PIX é exibido:
eles só aparecem quando retornados pela Pagar.me.
