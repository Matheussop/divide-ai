# DivideAí — Project Guidelines

## Overview

App de divisão de despesas de apartamento para 2 moradores. Mobile-first, minimalista, dark mode.

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS 3 + shadcn/ui (componentes)
- **Storage**: Vercel KV (Redis) — keys organizadas por `{entity}:{YYYY-MM}`
- **Auth**: NextAuth.js v5 (Credentials provider, JWT, apenas 2 usuários com senha)
- **Validação**: zod em todas as boundaries (server actions, API)
- **Export**: xlsx/SheetJS (Excel), texto formatado (WhatsApp)
- **Ícones**: lucide-react

## Architecture

```
src/
├── app/                    # App Router pages e layouts
│   ├── actions/            # Server actions (validação zod + auth check)
│   ├── api/auth/           # NextAuth route handler
│   ├── (auth)/             # Páginas de login (layout sem nav)
│   └── (dashboard)/        # Páginas autenticadas (layout com bottom nav)
├── components/             # Componentes React (shadcn/ui base)
│   ├── ui/                 # shadcn/ui primitivos
│   └── ...                 # Componentes do app
├── lib/                    # Utilitários e lógica compartilhada
│   ├── kv/                 # Helpers de acesso ao Vercel KV
│   ├── auth.ts             # Configuração NextAuth
│   ├── schemas.ts          # Zod schemas compartilhados
│   └── utils.ts            # Helpers gerais (cn, formatters)
└── types/                  # TypeScript type definitions
```

## Data Model (Vercel KV Keys)

| Key Pattern | Tipo | Conteúdo |
|-------------|------|----------|
| `users:{id}` | Hash | `{ id, nome, email, passwordHash }` |
| `categories` | JSON | Array de `{ id, nome, icone }` |
| `expenses:{YYYY-MM}` | JSON | Array de `{ id, valor, categoria, pagadorId, split, visitaId?, criadoPor, criadoEm }` |
| `guests:{YYYY-MM}` | JSON | Array de `{ id, nome, hostId, dataInicio, dataFim }` |
| `recurring` | JSON | Array de templates de despesas recorrentes |
| `balances:{YYYY-MM}` | JSON | `{ saldo, detalhes }` — saldo calculado do mês |

## Code Conventions

- **TypeScript strict mode** — sem `any`, usar tipos explícitos
- **Componentes**: PascalCase, um por arquivo, props tipadas com interface
- **Server actions**: em `src/app/actions/`, sempre validar input com zod, verificar sessão NextAuth
- **Retorno de actions**: `{ success: boolean, data?: T, error?: string }`
- **KV helpers**: em `src/lib/kv/`, funções tipadas para get/set
- **Imports**: usar alias `@/` para paths absolutos
- **Formatação**: Prettier + ESLint (configuração padrão Next.js)

## Build & Test

```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run start        # Production server local
```

## Business Rules

1. **Apenas 2 usuários** — seed inicial com bcrypt, sem registro público
2. **Divisão padrão**: 50/50, ajustável via slider (0-100%)
3. **Visitas**: período (data início/fim), vinculada a um morador (host)
4. **Divisão com visita**: `% visitante = dias_visita / dias_no_mês` — subtrai do host, redistribui
5. **Saldo acumulado**: se alguém ficou devendo no mês anterior, acumula
6. **Autoria**: cada despesa registra quem criou (`criadoPor`)
7. **Edição/exclusão**: requer confirmação (modal)

## UI Patterns

- **Mobile-first**: otimizado para 375px+ (iPhone SE), responsivo até desktop
- **Bottom navigation bar**: navegação principal no mobile
- **Dark mode**: Tailwind `class` strategy, toggle no header
- **shadcn/ui**: usar componentes do shadcn como base, customizar via CSS variables
- **Ícones**: lucide-react exclusivamente
- **Feedback**: toast notifications para ações, loading states em botões

## Security

- Senhas hasheadas com bcrypt (salt rounds: 12)
- JWT tokens via NextAuth, httpOnly cookies
- Server actions validam sessão antes de qualquer operação
- Input sanitizado via zod schemas
- Sem dados sensíveis no client-side
