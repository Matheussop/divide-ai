# Contribuindo para o DivideAí

## Workflow de Desenvolvimento

1. Crie uma branch a partir de `main`: `git checkout -b feature/nome-da-feature`
2. Implemente a mudança
3. Garanta que `npm run build` e `npm run lint` passam sem erros
4. Teste em 375px (iPhone SE) no DevTools
5. Teste dark mode (toggle no header)
6. Commit e push

## Padrões de Commit

Seguir [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adicionar filtro por categoria no relatório
fix: corrigir cálculo de split com visita cruzando meses
refactor: extrair lógica de saldo para helper separado
style: ajustar padding do card de despesa no mobile
docs: atualizar regras de negócio com caso de visita
chore: atualizar dependências
```

## Checklist de PR

- [ ] `npm run build` sem erros
- [ ] `npm run lint` sem warnings
- [ ] Testado em 375px (mobile)
- [ ] Testado em dark mode
- [ ] Server actions validam input com zod
- [ ] Server actions verificam sessão NextAuth
- [ ] Valores monetários em centavos (não float)
- [ ] Sem `any` no TypeScript
- [ ] Componentes usam shadcn/ui como base

## Estrutura de Arquivos

- **Novo componente**: `src/components/NomeDoComponente.tsx`
- **Nova server action**: `src/app/actions/{dominio}.ts`
- **Novo helper KV**: `src/lib/kv/{entidade}.ts`
- **Novo tipo**: `src/types/index.ts` (arquivo único)
- **Novo schema zod**: `src/lib/schemas.ts` (arquivo único)
