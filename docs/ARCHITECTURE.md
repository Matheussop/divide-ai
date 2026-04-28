# Arquitetura — DivideAí

## Visão Geral

```mermaid
graph TB
    Client[Browser / PWA]

    subgraph "Next.js 14 App Router"
        Pages[Pages & Layouts]
        SA[Server Actions]
        API[API Routes - NextAuth]
    end

    subgraph "Data Layer"
        KV[(Vercel KV / Redis)]
    end

    Client -->|HTTP| Pages
    Client -->|Form Actions| SA
    Client -->|Auth| API
    SA -->|get/set| KV
    API -->|JWT sessions| Client
    Pages -->|RSC| SA
```

## Fluxo de Autenticação

```mermaid
sequenceDiagram
    participant U as Usuário
    participant C as Client (Browser)
    participant N as NextAuth
    participant KV as Vercel KV

    U->>C: Email + Senha
    C->>N: POST /api/auth/callback/credentials
    N->>KV: Busca users:{email}
    KV-->>N: { id, nome, passwordHash }
    N->>N: bcrypt.compare(senha, hash)
    N-->>C: JWT token (httpOnly cookie)
    C-->>U: Redirect → Dashboard
```

## Componentes Principais

### Layout Structure

```mermaid
graph TB
    subgraph "Root Layout"
        subgraph "(auth) Layout"
            Login["/login"]
        end
        subgraph "(dashboard) Layout"
            Nav[Bottom Nav Bar]
            Dashboard["/dashboard"]
            Expenses["/expenses"]
            Categories["/categories"]
            Guests["/guests"]
            Reports["/reports"]
        end
    end
```

### Server Actions Flow

```
Client Component
  → Form submit / onClick
    → Server Action (src/app/actions/)
      → 1. auth() — verifica sessão
      → 2. schema.safeParse() — valida input
      → 3. kv.get/set() — operação no KV
      → 4. revalidatePath() — atualiza cache
    ← { success, data?, error? }
  ← UI update (optimistic ou revalidate)
```

## Decisões de Arquitetura

| Decisão | Motivo |
|---------|--------|
| App Router (não Pages) | Server Components, Server Actions, layouts aninhados |
| Vercel KV (não Postgres) | Zero infra, gratuito no hobby, suficiente para 2 usuários |
| JWT (não session DB) | Sem storage extra, 2 usuários = stateless é ideal |
| Server Actions (não API Routes) | Tipagem end-to-end, form progressive enhancement |
| shadcn/ui (não Material/Ant) | Customizável, copy-paste, sem bundle desnecessário |
| Dados por mês `{YYYY-MM}` | Queries eficientes, sem scan de toda a base |
