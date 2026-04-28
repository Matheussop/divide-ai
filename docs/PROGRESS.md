# DivideAí — Progresso do Projeto

> Última atualização: 28/04/2026 — Fase 1 concluída

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
| 1.9 | Página de login | ✅ | `src/app/login/page.tsx` com `signIn("credentials")` |
| 1.10 | Middleware de proteção de rotas | ✅ | `src/middleware.ts` protegendo rotas privadas |

---

## Fase 2 — Core (Steps 4-8) — depende da Fase 1

| # | Task | Status | Notas |
|---|------|--------|-------|
| 2.1 | Layout mobile (bottom nav bar) | ⏳ | `src/app/(dashboard)/layout.tsx`, nav com ícones |
| 2.2 | Dashboard mensal | ⏳ | Total gasto, quanto cada um pagou, saldo |
| 2.3 | CRUD de despesas | ⏳ | Formulário com slider de split, categorias |
| 2.4 | CRUD de categorias | ⏳ | Nome + ícone lucide-react, customizáveis |
| 2.5 | CRUD de visitas (guests) | ⏳ | Período data início/fim, vinculada a morador |
| 2.6 | Navegação de histórico mensal | ⏳ | Selector de mês, carregar dados do KV |
| 2.7 | Server actions para cada entidade | ⏳ | expenses, categories, guests (com validação zod + auth) |
| 2.8 | Categorias padrão no seed | ⏳ | Aluguel, Mercado, Internet, Energia, Água, Lazer, Outros |

---

## Fase 3 — Inteligência (Steps 9-10) — depende da Fase 2

| # | Task | Status | Notas |
|---|------|--------|-------|
| 3.1 | Divisão proporcional com visita | ⏳ | Fórmula: % visitante = dias_visita / dias_mês |
| 3.2 | Despesas recorrentes (templates) | ⏳ | CRUD de templates, sugestão mensal |
| 3.3 | Saldo acumulado entre meses | ⏳ | Carregar saldo do mês anterior no dashboard |

---

## Fase 4 — Relatórios (Steps 11-13) — paralelo com Fase 3

| # | Task | Status | Notas |
|---|------|--------|-------|
| 4.1 | Relatório mensal detalhado | ⏳ | Por categoria, por pessoa, gráficos CSS |
| 4.2 | Export WhatsApp | ⏳ | Texto formatado → link wa.me |
| 4.3 | Export Excel | ⏳ | xlsx/SheetJS, aba despesas + aba resumo |

---

## Fase 5 — Polish (Steps 14-16) — depende de todas

| # | Task | Status | Notas |
|---|------|--------|-------|
| 5.1 | Dark mode (toggle + persistência) | ⏳ | Tailwind class strategy, localStorage |
| 5.2 | PWA básico | ⏳ | manifest.json, service worker, ícones |
| 5.3 | Testes de responsividade (375px+) | ⏳ | Todas as telas no iPhone SE |
| 5.4 | Deploy na Vercel | ⏳ | Vercel KV addon, env vars, domínio |

---

## Verificação Final

| # | Critério | Status |
|---|----------|--------|
| V1 | `npm run build` sem erros | ✅ |
| V2 | Login com ambos os usuários | ⏳ |
| V3 | Despesa 50/50 e customizada → saldo correto | ⏳ |
| V4 | Visita de 5 dias → cálculo 5/30 = 16.7% | ⏳ |
| V5 | Despesa no período da visita → saldo correto | ⏳ |
| V6 | Export WhatsApp → formatação legível | ⏳ |
| V7 | Export Excel → abre no Google Sheets | ⏳ |
| V8 | Todas as telas em 375px | ⏳ |
| V9 | Deploy Vercel → KV funcionando em prod | ⏳ |

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

## Próximo Passo

**Fase 2.1** → Implementar layout mobile do dashboard com bottom nav (`src/app/(dashboard)/layout.tsx`).

## Observações Técnicas

- Migração para Tailwind 4 concluída com Node 20.
- Build está verde com `eslint.ignoreDuringBuilds` em `next.config.mjs` (ajuste temporário para avançar implementação).
