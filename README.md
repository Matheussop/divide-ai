# DivideAí 💰

App de divisão de despesas de apartamento para 2 moradores. Mobile-first, minimalista, dark mode.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS 3** + **shadcn/ui**
- **Vercel KV** (Redis) — storage
- **NextAuth.js v5** — autenticação (JWT, 2 usuários)
- **zod** — validação
- **xlsx/SheetJS** — export Excel
- **lucide-react** — ícones

## Setup Local

### Pré-requisitos

- Node.js 18+
- Conta na Vercel (para Vercel KV)

### Instalação

```bash
git clone <repo-url>
cd divide-ai
npm install
```

### Variáveis de Ambiente

Crie um arquivo `.env.local`:

```env
# Vercel KV
KV_URL=your-kv-url
KV_REST_API_URL=your-kv-rest-api-url
KV_REST_API_TOKEN=your-kv-rest-api-token
KV_REST_API_READ_ONLY_TOKEN=your-kv-read-only-token

# NextAuth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### Seed de Usuários

```bash
npm run seed
```

Cria 2 usuários iniciais com senhas hasheadas (bcrypt).

### Desenvolvimento

```bash
npm run dev      # Dev server → http://localhost:3000
npm run build    # Build de produção
npm run lint     # Linting
```

## Estrutura do Projeto

```
src/
├── app/                    # App Router pages e layouts
│   ├── actions/            # Server actions
│   ├── api/auth/           # NextAuth route handler
│   ├── (auth)/             # Páginas de login
│   └── (dashboard)/        # Páginas autenticadas
├── components/             # Componentes React
│   └── ui/                 # shadcn/ui primitivos
├── lib/                    # Utilitários
│   ├── kv/                 # Helpers Vercel KV
│   ├── auth.ts             # Config NextAuth
│   └── schemas.ts          # Zod schemas
└── types/                  # TypeScript types
```

## Funcionalidades

- Login individual (2 usuários com senha)
- Dashboard mensal (total, saldo, quem deve)
- CRUD de despesas (divisão customizável 50/50 ou slider)
- Categorias customizáveis com ícone
- Gestão de visitas (período, vinculada a morador)
- Divisão proporcional com visita (dias/mês)
- Despesas recorrentes (templates mensais)
- Histórico mensal
- Relatório mensal (por categoria, por pessoa)
- Export WhatsApp (texto formatado)
- Export Excel (planilha + aba resumo)
- Mobile-first (bottom nav, 375px+)
- Dark mode
- PWA básico

## Deploy

Deploy automático na Vercel. Vercel KV configurado como addon no projeto.

```bash
vercel --prod
```

## Documentação

- [Arquitetura](docs/ARCHITECTURE.md)
- [Modelo de Dados](docs/DATA-MODEL.md)
- [Regras de Negócio](docs/BUSINESS-RULES.md)
- [Contribuição](CONTRIBUTING.md)

## Licença

Projeto privado.
