---
description: "Use when creating or editing React components in src/components/. Covers shadcn/ui patterns, TypeScript props, mobile-first responsive design, dark mode support, and lucide-react icons."
applyTo: "src/components/**"
---
# Component Guidelines

## shadcn/ui
- Use shadcn/ui components as base (`Button`, `Card`, `Dialog`, `Input`, etc.)
- Compose complex components from shadcn/ui primitives
- Customize via CSS variables in `globals.css`, not inline overrides
- Import from `@/components/ui/`

## TypeScript
- Define props with `interface` (not `type` for component props)
- Never use `any` — prefer `unknown` + narrowing if type is uncertain
- Export component as named export (not default)

## Styling
- Mobile-first: start with mobile layout, add `md:` / `lg:` breakpoints
- Min target: 375px (iPhone SE)
- Dark mode: use `dark:` variant classes
- Spacing: use Tailwind spacing scale consistently
- Use `cn()` from `@/lib/utils` for conditional classes

## Icons
- Use lucide-react exclusively: `import { IconName } from "lucide-react"`
- Standard size: `size={20}` for inline, `size={24}` for standalone
- Match icon color with text: `className="text-muted-foreground"`

## Patterns
```tsx
// Correct pattern
interface ExpenseCardProps {
  expense: Expense;
  onEdit: (id: string) => void;
}

export function ExpenseCard({ expense, onEdit }: ExpenseCardProps) {
  return (
    <Card className="p-4">
      {/* content */}
    </Card>
  );
}
```
