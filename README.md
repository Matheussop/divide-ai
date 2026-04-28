# DivideAí 💰

App de divisão de despesas de apartamento para 2 moradores. Mobile-first, minimalista, dark mode.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS 3** + **shadcn/ui**
- **Redis** (via URL de conexão) — storage
- **NextAuth.js v5** — autenticação (JWT, 2 usuários)
- **zod** — validação
- **xlsx/SheetJS** — export Excel
- **lucide-react** — ícones

## Setup Local

### Pré-requisitos

- Node.js 18+
- Instância Redis com URL de conexão

### Instalação

```bash
git clone <repo-url>
cd divide-ai
npm install
```

### Variáveis de Ambiente

Crie um arquivo `.env.local`:

```env
# Redis
divide_ai_bd_REDIS_URL=redis://user:password@host:port

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
│   ├── kv/                 # Helpers de acesso ao Redis
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

Deploy automático na Vercel com variável de ambiente do Redis configurada no projeto.

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
