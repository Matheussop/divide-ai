# Modelo de Dados — DivideAí

## Storage: Vercel KV (Redis)

Dados armazenados como JSON strings em keys Redis. Organizados por mês (`YYYY-MM`) para queries eficientes.

---

## Entidades

### User

**Key**: `users:{id}`

```typescript
interface User {
  id: string;           // UUID
  nome: string;         // "Matheus", "João"
  email: string;        // Único, usado no login
  passwordHash: string; // bcrypt hash (salt rounds: 12)
}
```

**Exemplo**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nome": "Matheus",
  "email": "matheus@divide.ai",
  "passwordHash": "$2b$12$..."
}
```

---

### Category

**Key**: `categories`

```typescript
interface Category {
  id: string;    // UUID
  nome: string;  // "Aluguel", "Mercado", "Internet"
  icone: string; // Nome do ícone lucide-react: "home", "shopping-cart"
}
```

**Exemplo**:
```json
[
  { "id": "cat-1", "nome": "Aluguel", "icone": "home" },
  { "id": "cat-2", "nome": "Mercado", "icone": "shopping-cart" },
  { "id": "cat-3", "nome": "Internet", "icone": "wifi" },
  { "id": "cat-4", "nome": "Energia", "icone": "zap" },
  { "id": "cat-5", "nome": "Lazer", "icone": "gamepad-2" }
]
```

---

### Expense

**Key**: `expenses:{YYYY-MM}` (e.g., `expenses:2026-04`)

```typescript
interface Expense {
  id: string;           // UUID
  valor: number;        // Em centavos (R$ 150,00 = 15000)
  descricao: string;    // "Conta de luz abril"
  categoriaId: string;  // Ref → Category.id
  pagadorId: string;    // Ref → User.id (quem pagou)
  split: {
    [userId: string]: number; // Porcentagem (0-100), soma = 100
  };
  visitaId?: string;    // Ref → Guest.id (se despesa durante visita)
  criadoPor: string;    // Ref → User.id (auditoria)
  criadoEm: string;     // ISO 8601
  atualizadoEm: string; // ISO 8601
}
```

**Exemplo**:
```json
{
  "id": "exp-001",
  "valor": 15000,
  "descricao": "Conta de luz abril",
  "categoriaId": "cat-4",
  "pagadorId": "user-1",
  "split": {
    "user-1": 50,
    "user-2": 50
  },
  "visitaId": null,
  "criadoPor": "user-1",
  "criadoEm": "2026-04-15T10:30:00.000Z",
  "atualizadoEm": "2026-04-15T10:30:00.000Z"
}
```

> **Nota**: Valores em centavos evitam problemas de floating point.

---

### Guest (Visita)

**Key**: `guests:{YYYY-MM}` (e.g., `guests:2026-04`)

```typescript
interface Guest {
  id: string;        // UUID
  nome: string;      // "Maria"
  hostId: string;    // Ref → User.id (morador responsável)
  dataInicio: string; // ISO date "2026-04-10"
  dataFim: string;    // ISO date "2026-04-14"
}
```

**Exemplo**:
```json
{
  "id": "guest-001",
  "nome": "Maria",
  "hostId": "user-1",
  "dataInicio": "2026-04-10",
  "dataFim": "2026-04-14"
}
```

---

### Recurring Template

**Key**: `recurring`

```typescript
interface RecurringTemplate {
  id: string;
  descricao: string;    // "Aluguel"
  valor: number;        // Em centavos
  categoriaId: string;
  split: {
    [userId: string]: number;
  };
  ativo: boolean;       // Pode ser desativado sem deletar
}
```

---

### Balance (Saldo Mensal)

**Key**: `balances:{YYYY-MM}`

```typescript
interface MonthlyBalance {
  mes: string;          // "2026-04"
  saldoAnterior: number; // Saldo acumulado do mês anterior (centavos)
  totalGasto: number;    // Total de despesas do mês
  porPessoa: {
    [userId: string]: {
      pagou: number;     // Total que pagou
      deve: number;      // Total que deve
    };
  };
  saldoFinal: number;    // Positivo = user-1 deve, Negativo = user-2 deve
  calculadoEm: string;   // ISO 8601
}
```

---

## Queries Comuns

| Operação | Key | Método |
|----------|-----|--------|
| Listar despesas do mês | `expenses:2026-04` | `kv.get()` |
| Listar visitas do mês | `guests:2026-04` | `kv.get()` |
| Buscar usuário por email | `users:*` | `kv.get()` por ID (manter index `user-emails` → `{email: userId}`) |
| Listar categorias | `categories` | `kv.get()` |
| Saldo do mês anterior | `balances:2026-03` | `kv.get()` |
| Meses com dados | `expenses:*` | `kv.keys("expenses:*")` |

## Índices Auxiliares

| Key | Conteúdo | Propósito |
|-----|----------|-----------|
| `user-emails` | `{ "email@x.com": "user-id" }` | Lookup rápido por email no login |
| `months-with-data` | `["2026-01", "2026-02", ...]` | Navegação de histórico sem scan |
