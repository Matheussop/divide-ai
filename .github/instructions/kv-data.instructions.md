---
description: "Use when working with Vercel KV data access layer in src/lib/kv/. Covers key conventions, JSON serialization, typed helpers, and data access patterns."
applyTo: "src/lib/kv/**"
---
# Vercel KV Data Access Guidelines

## Key Conventions
- `users:{id}` — user data (hash)
- `categories` — global categories array
- `expenses:{YYYY-MM}` — expenses for a given month
- `guests:{YYYY-MM}` — guest visits for a given month
- `recurring` — recurring expense templates
- `balances:{YYYY-MM}` — calculated monthly balance

## Typed Helpers
- One file per entity: `expenses.ts`, `guests.ts`, `categories.ts`, etc.
- Export `get` and `set` functions with TypeScript generics
- Always deserialize from JSON with type assertion after validation

## Pattern
```typescript
import { kv } from "@vercel/kv";
import type { Expense } from "@/types";

const key = (month: string) => `expenses:${month}`;

export async function getExpenses(month: string): Promise<Expense[]> {
  return (await kv.get<Expense[]>(key(month))) ?? [];
}

export async function setExpenses(month: string, expenses: Expense[]): Promise<void> {
  await kv.set(key(month), expenses);
}
```

## Rules
- Always provide a default value (`?? []`, `?? null`) for missing keys
- Month format: `YYYY-MM` (e.g., `2026-04`)
- IDs: use `crypto.randomUUID()`
- Timestamps: ISO 8601 strings
- Never expose KV client directly to components — always go through helpers
