---
description: "Use when creating or editing server actions in src/app/actions/. Covers zod validation, NextAuth session checks, Vercel KV operations, and consistent return types."
applyTo: "src/app/actions/**"
---
# Server Action Guidelines

## Structure
- One file per domain: `expenses.ts`, `categories.ts`, `guests.ts`, `recurring.ts`
- Mark with `"use server"` at top of file
- Each action is an async function

## Validation
- Always validate input with zod schema as first step
- Import schemas from `@/lib/schemas`
- Use `schema.safeParse(input)` — never trust client data

## Authentication
- Check session with `auth()` from NextAuth before any operation
- Return `{ success: false, error: "Não autorizado" }` if no session
- Record `session.user.id` as `criadoPor` on create operations

## Return Type
```typescript
type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
```

## Vercel KV
- Use typed helpers from `@/lib/kv/`
- Key pattern: `expenses:{YYYY-MM}` — derive from expense date
- Always use atomic operations (get → modify → set within same action)

## Pattern
```typescript
"use server";

import { auth } from "@/lib/auth";
import { expenseSchema } from "@/lib/schemas";
import { getExpenses, setExpenses } from "@/lib/kv/expenses";

export async function createExpense(input: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Não autorizado" };

  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.message };

  // ... KV operations
  return { success: true, data: newExpense };
}
```
