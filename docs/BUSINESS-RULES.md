# Regras de Negócio — DivideAí

## 1. Usuários

- **Exatamente 2 moradores** — cadastrados via seed, sem registro público
- Login com email + senha (bcrypt hash, salt rounds: 12)
- Sessão via JWT (NextAuth), sem banco de sessões

## 2. Divisão de Despesas

### 2.1 Divisão Padrão (50/50)

Cada despesa é dividida igualmente entre os 2 moradores por padrão.

```
Despesa: R$ 200,00 (Mercado)
Pagador: User A

User A pagou: R$ 200,00
User A deve: R$ 100,00 (50%)
User B deve: R$ 100,00 (50%)

Saldo: User B deve R$ 100,00 para User A
```

### 2.2 Divisão Customizada

O split pode ser ajustado via slider (0% a 100%).

```
Despesa: R$ 300,00 (Móvel do quarto)
Pagador: User A
Split: User A = 70%, User B = 30%

User A pagou: R$ 300,00
User A deve: R$ 210,00 (70%)
User B deve: R$ 90,00 (30%)

Saldo: User B deve R$ 90,00 para User A
```

### 2.3 Divisão 100/0

Despesa exclusiva de um morador (não divide).

```
Despesa: R$ 50,00 (Produto pessoal)
Pagador: User A
Split: User A = 100%, User B = 0%

Saldo: R$ 0,00 (ninguém deve nada)
```

## 3. Visitas (Guests)

### 3.1 Registro de Visita

- Cada visita tem: nome do visitante, morador responsável (host), período (data início/fim)
- Uma visita pertence a um morador (host)
- Períodos podem cruzar meses (registrada no mês da data de início)

### 3.2 Cálculo Proporcional com Visita

Quando há uma visita no mês, despesas durante o período da visita podem ser redistribuídas.

**Fórmula:**

$$
\%_{visitante} = \frac{dias_{visita}}{dias_{mês}}
$$

$$
custo_{visitante} = valor \times \%_{visitante}
$$

O custo do visitante é subtraído do total e atribuído ao host:

$$
custo_{host} = custo_{visitante} + (valor - custo_{visitante}) \times \frac{split_{host}}{100}
$$

$$
custo_{outro} = (valor - custo_{visitante}) \times \frac{split_{outro}}{100}
$$

### 3.3 Exemplo Completo

```
Mês: Abril (30 dias)
Visita: Maria, host = User A, 10/abr a 14/abr (5 dias)

Despesa durante visita: R$ 300,00 (Mercado)
Pagador: User A
Split base: 50/50

Cálculo:
  % visitante = 5/30 = 16.67%
  Custo visitante = 300 × 0.1667 = R$ 50,00 (pago pelo host User A)
  Valor restante = 300 - 50 = R$ 250,00
  User A deve: R$ 50,00 (visitante) + R$ 125,00 (50% de 250) = R$ 175,00
  User B deve: R$ 125,00 (50% de 250)

  User A pagou R$ 300,00, deve R$ 175,00
  Saldo: User B deve R$ 125,00 para User A
```

### 3.4 Despesas Fora do Período de Visita

Despesas em datas fora do período da visita seguem a divisão normal (sem fator visitante).

## 4. Saldo Acumulado

- Se no final do mês User B deve R$ 100,00 para User A, esse valor é carregado pro mês seguinte
- O saldo acumulado aparece no dashboard como "Saldo anterior"
- Quando um morador paga o outro, pode-se registrar como "Acerto" (categoria especial)

```
Mês anterior (Março): User B deve R$ 150,00
Mês atual (Abril): User A deve R$ 80,00

Saldo final Abril: User B deve R$ 150,00 - R$ 80,00 = R$ 70,00
```

## 5. Despesas Recorrentes

- Templates salvos: descrição, valor, categoria, split
- Todo início de mês, o app sugere criar as despesas recorrentes
- O usuário confirma/edita antes de salvar
- Templates podem ser ativados/desativados

## 6. Categorias

- Customizáveis: nome + ícone (lucide-react)
- Categorias padrão criadas no seed: Aluguel, Mercado, Internet, Energia, Água, Lazer, Outros
- Categoria especial "Acerto" para pagamentos entre moradores

## 7. Auditoria

- Cada despesa registra `criadoPor` (quem criou) e `criadoEm` (timestamp)
- Edições atualizam `atualizadoEm`
- Exclusão requer confirmação via modal

## 8. Relatórios

### 8.1 Relatório Mensal
- Total gasto no mês
- Total por categoria (com gráfico CSS)
- Total por pessoa (pagou vs deve)
- Saldo final (quem deve quanto)

### 8.2 Export WhatsApp
- Texto formatado com resumo do mês
- Abre link `wa.me` com texto pré-preenchido
- Formato: emoji + categoria + valor + quem pagou

### 8.3 Export Excel
- Aba 1: Lista de despesas (data, descrição, categoria, valor, pagador, split)
- Aba 2: Resumo (totais por categoria, saldo)
