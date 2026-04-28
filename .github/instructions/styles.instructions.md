---
description: "Use when editing CSS files. Covers Tailwind CSS conventions, shadcn/ui CSS variables, dark mode class strategy, and design tokens."
applyTo: "**/*.css"
---
# Styling Guidelines

## Tailwind CSS
- Use Tailwind utility classes exclusively — avoid custom CSS unless necessary
- Follow mobile-first: base → `sm:` → `md:` → `lg:`
- Use `@apply` sparingly, only for repeated patterns in CSS

## Dark Mode
- Strategy: `class` (set in `tailwind.config.ts`)
- Use `dark:` variant for dark mode overrides
- CSS variables in `:root` and `.dark` for theme colors

## shadcn/ui Design Tokens
- Colors defined as CSS variables: `--background`, `--foreground`, `--primary`, etc.
- Reference in Tailwind: `bg-background`, `text-foreground`, `border-border`
- Customize in `globals.css` under `:root` and `.dark`

## Spacing & Typography
- Use Tailwind spacing scale: `p-4`, `gap-3`, `mt-2`
- Font sizes: `text-sm` (labels), `text-base` (body), `text-lg` (headings), `text-2xl` (page titles)
- Currency values: `font-mono` for alignment
