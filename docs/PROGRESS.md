# DivideAí — Progresso do Projeto

> Última atualização: 29/04/2026 — build verde, login ajustado para deploy e histórico com ações de admin

---

## Legenda

- ✅ Concluído
- 🔄 Em andamento
- ⏳ Pendente
- ❌ Bloqueado

---

## Fase 0 — Documentação & IA Setup

| # | Task | Status | Notas |
|---|------|--------|-------|
| 0.1 | `.github/AGENTS.md` — instruções globais para IAs | ✅ | Stack, arquitetura, convenções, regras de negócio |
| 0.2 | File Instructions (`.github/instructions/`) | ✅ | 4 arquivos: components, server-actions, kv-data, styles |
| 0.3 | Custom Agents (`.github/agents/`) | ✅ | 3 agentes: expense-logic, ui-reviewer, data-migration |
| 0.4 | Documentação (`docs/`, README, CONTRIBUTING) | ✅ | ARCHITECTURE.md, DATA-MODEL.md, BUSINESS-RULES.md |
| 0.5 | Skills de IA (`.agents/skills/`) | ✅ | frontend-design, next-best-practices, web-design-guidelines |

---

## Fase 1 — Setup & Auth (Steps 1-10)

| # | Task | Status | Notas |
|---|------|--------|-------|
| 1.1 | Criar projeto Next.js 14 (App Router, TS, Tailwind) | ✅ | `create-next-app@14`, src dir, import alias `@/*` |
| 1.2 | Instalar e configurar shadcn/ui | ✅ | `npx shadcn@latest init`, 13 componentes: button, card, input, label, dialog, slider, tabs, select, separator, badge, avatar, dropdown-menu, sheet, sonner |
| 1.3 | Instalar dependências do projeto | ✅ | @vercel/kv, next-auth@beta, zod, bcryptjs, xlsx, lucide-react, @types/bcryptjs |
| 1.4 | Configurar NextAuth (Credentials + JWT) | ✅ | `src/lib/auth.ts`, route handler e callbacks JWT/session |
| 1.5 | Configurar Vercel KV | ✅ | Helpers tipados em `src/lib/kv/` para users, expenses, categories, guests, recurring e balances |
| 1.6 | Criar tipos TypeScript | ✅ | `src/types/index.ts` com entidades centrais do domínio |
| 1.7 | Criar schemas zod | ✅ | `src/lib/schemas.ts` com validação de login e entidades |
| 1.8 | Seed de usuários (2 moradores) | ✅ | Script `scripts/seed.ts` com hash bcrypt e categorias padrão |
| 1.9 | Página de login | ✅ | `src/app/login/page.tsx` com `signIn("credentials")`, `callbackUrl` e redirect estável via `window.location.assign(...)` |
| 1.10 | Middleware de proteção de rotas | ✅ | `src/middleware.ts` protegendo rotas privadas |

---

## Fase 2 — Core (Steps 4-8) — depende da Fase 1

| # | Task | Status | Notas |
|---|------|--------|-------|
| 2.1 | Layout mobile (bottom nav bar) | ✅ | `src/app/(dashboard)/layout.tsx` com navegação inferior e header autenticado |
| 2.2 | Dashboard mensal | ✅ | Home autenticada com resumo do mês, categorias e últimos lançamentos |
| 2.3 | CRUD de despesas | ✅ | Página /despesas funcional com criação, edição, exclusão e revalidação do dashboard |
| 2.4 | CRUD de categorias | ✅ | Nome + ícone lucide-react (usando IconPicker), customizáveis |
| 2.5 | CRUD de visitas (guests) | ✅ | Página /visitas funcional com criação, edição, exclusão e validação de período |
| 2.6 | Navegação de histórico mensal | ✅ | Selector `?mes=YYYY-MM` aplicado em dashboard, despesas e visitas, com leitura e mutação por mês no KV |
| 2.7 | Server actions para cada entidade | ✅ | expenses, categories, guests, recurring e logs com validação + auth |
| 2.8 | Categorias padrão no seed | ✅ | Seed já grava categorias padrão no Redis |

---

## Fase 3 — Inteligência (Steps 9-10) — depende da Fase 2

| # | Task | Status | Notas |
|---|------|--------|-------|
| 3.1 | Divisão proporcional com visita | ✅ | Suporte a múltiplos repasses por despesa e leitura de visitas do mês anterior quando necessário |
| 3.2 | Despesas recorrentes (templates) | ✅ | CRUD de templates e visualização/aplicação em `/recorrentes` |
| 3.3 | Saldo acumulado entre meses | ✅ | Carregando saldoFinal do mês anterior e calculando projeção |

---

## Fase 4 — Relatórios (Steps 11-13) — paralelo com Fase 3

| # | Task | Status | Notas |
|---|------|--------|-------|
| 4.1 | Relatório mensal detalhado | ✅ | Resumo, top categorias e responsabilidade por visitas na `/relatorio` |
| 4.2 | Export WhatsApp | ✅ | Texto formatado via `wa.me` com resumo, lançamentos e repasses por visita |
| 4.3 | Export Excel | ✅ | Gerando aba despesas + aba resumo via `xlsx` |

---

## Fase 5 — Polish (Steps 14-16) — depende de todas

| # | Task | Status | Notas |
|---|------|--------|-------|
| 5.1 | Dark mode (toggle + persistência) | ✅ | Toggle no header com `next-themes` e persistência |
| 5.2 | PWA básico | ✅ | manifest.json e web app configuration basic (ícones) |
| 5.3 | Testes de responsividade (375px+) | ⏳ | Ainda falta validar fluxos reais em login, relatório, histórico e formulários longos |
| 5.4 | Deploy na Vercel | 🔄 | Build de produção passa; falta validar sessão/cookies/envs no domínio final e fluxo completo pós-login |
| 5.5 | Histórico administrativo | ✅ | Admin pode remover itens individuais e limpar todo o histórico em `/historico` |

---

## Verificação Final

| # | Critério | Status |
|---|----------|--------|
| V1 | `npm run build` sem erros | ✅ |
| V2 | Login com ambos os usuários | 🔄 | Fluxo local ajustado e build verde; falta validar 100% no deploy final da Vercel |
| V3 | Despesa 50/50 e customizada → saldo correto | ⏳ | Recomendado validar com massa de dados fixa |
| V4 | Visita de 5 dias → cálculo 5/30 = 16.7% | ⏳ | Revalidar cenários simples e com visitas herdadas do mês anterior |
| V5 | Despesa no período da visita → saldo correto | ⏳ | Validar casos com múltiplas visitas simultâneas |
| V6 | Export WhatsApp → formatação legível | 🔄 | Estrutura melhorada; falta validar mensagem real em dispositivo/app WhatsApp |
| V7 | Export Excel → abre no Google Sheets | ⏳ | Ainda sem checagem manual documentada |
| V8 | Todas as telas em 375px | ⏳ |
| V9 | Deploy Vercel → KV funcionando em prod | 🔄 | Build passa; falta validar envs, auth e persistência no ambiente remoto |

---

## Arquivos Criados

```
divide-ai/
├── .agents/skills/                          # Skills de IA
│   ├── frontend-design/SKILL.md
│   ├── next-best-practices/                 # (múltiplos arquivos)
│   └── web-design-guidelines/SKILL.md
├── .github/
│   ├── AGENTS.md                            # Instruções globais para IAs
│   ├── agents/
│   │   ├── expense-logic.agent.md           # Agente: lógica financeira
│   │   ├── ui-reviewer.agent.md             # Agente: revisão UI
│   │   └── data-migration.agent.md          # Agente: migração de dados
│   └── instructions/
│       ├── nextjs-components.instructions.md
│       ├── server-actions.instructions.md
│       ├── kv-data.instructions.md
│       └── styles.instructions.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── BUSINESS-RULES.md
│   └── DATA-MODEL.md
├── CONTRIBUTING.md
├── README.md
└── src/                                     # Código Next.js (template padrão)
```

---

## Leitura Atual

- O produto já cobre o fluxo principal: auth, dashboard mensal, despesas, categorias, visitas, recorrentes, histórico e relatórios.
- A lógica financeira está mais madura do que o documento anterior indicava: já existe suporte a múltiplos repasses por visita e export WhatsApp com esse contexto.
- O maior risco atual não é falta de feature, e sim validação operacional: cenários de cálculo, experiência mobile e comportamento no deploy.
- O build de produção está verde, mas o projeto ainda depende de validação manual importante em Vercel e em fluxos reais de uso.

## Próximos Passos Recomendados

### Prioridade 1 — Fechar produção

1. Validar login/logout no domínio final da Vercel.
2. Confirmar variáveis de ambiente de auth em produção (`AUTH_SECRET`, `NEXTAUTH_URL` ou equivalente).
3. Verificar se cookies/sessão sobrevivem a redirect, refresh e navegação protegida.
4. Testar persistência Redis em produção para despesas, visitas, recorrentes e histórico.

### Prioridade 2 — Congelar regras financeiras

1. Montar uma massa de dados pequena e previsível para validar cálculos manualmente.
2. Validar cenários de split 50/50, split customizado, visita pontual e visita mensal.
3. Validar cenário com múltiplas visitas simultâneas na mesma despesa.
4. Revisar saldo acumulado entre meses, especialmente quando a visita começa no mês anterior.
5. Transformar esses cenários em testes automatizados de regra de negócio.

### Prioridade 3 — Fechar exports

1. Validar export WhatsApp em um dispositivo real.
2. Validar export Excel no Excel e no Google Sheets.
3. Considerar adicionar no Excel uma aba ou colunas com repasses por visita para manter paridade com o WhatsApp.

### Prioridade 4 — Melhorar operação/admin

1. Adicionar filtros no histórico por tipo de ação e texto.
2. Registrar mais ações no histórico onde ainda não houver logging consistente.
3. Revisar permissões administrativas além de usuários/histórico, se necessário.

### Prioridade 5 — UX e qualidade

1. Fazer revisão responsiva real em 375px nas páginas `/despesas`, `/relatorio`, `/historico` e `/recorrentes`.
2. Revisar mensagens de erro e feedbacks de sucesso em formulários e exports.
3. Reabilitar lint no build quando o projeto estiver estabilizado.

## Observações Técnicas

- Migração para Tailwind 4 concluída com Node 20.
- Build está verde com `npm run build`.
- `eslint.ignoreDuringBuilds` continua ativo em `next.config.mjs`; isso ainda é débito técnico.
- Camada de dados migrada para Redis direto via `divide_ai_bd_REDIS_URL`.
- O documento anterior estava desatualizado em relação a repasses múltiplos, export WhatsApp e histórico administrativo.
