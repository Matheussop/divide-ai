export interface User {
  id: string;
  nome: string;
  email: string;
  passwordHash: string;
  role?: "admin" | "user";
}

export interface Category {
  id: string;
  nome: string;
  icone: string;
}

export interface Expense {
  id: string;
  valor: number; // centavos
  data?: string; // YYYY-MM-DD (data efetiva da despesa)
  visitaPolitica?: "none" | "during" | "month";
  descricao: string;
  categoriaId: string;
  pagadorId: string;
  split: Record<string, number>; // { [userId]: porcentagem 0-100 }
  visitaId?: string;
  criadoPor: string;
  criadoEm: string; // ISO 8601
  atualizadoEm: string;
}

export interface GuestPeriod {
  dataInicio: string; // YYYY-MM-DD
  dataFim: string; // YYYY-MM-DD
}

export interface Guest {
  id: string;
  nome: string;
  hostId: string;
  periodos: GuestPeriod[];
}

export interface RecurringTemplate {
  id: string;
  descricao: string;
  valor: number; // centavos
  categoriaId: string;
  split: Record<string, number>;
  ativo: boolean;
  visitaPolitica?: "none" | "during" | "month";
}

export interface MonthlyBalance {
  mes: string; // YYYY-MM
  saldoAnterior: number; // centavos
  totalGasto: number;
  porPessoa: Record<
    string,
    {
      pagou: number;
      deve: number;
    }
  >;
  saldoFinal: number; // positivo = user1 deve para user2
  calculadoEm: string;
}

export type ActionResult<T = undefined> = {
  success: boolean;
  data?: T;
  error?: string;
};
