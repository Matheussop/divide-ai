import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const expenseSchema = z.object({
  valor: z.number().int().positive("Valor deve ser positivo"),
  descricao: z.string().min(1, "Descrição obrigatória").max(200),
  categoriaId: z.string().min(1),
  pagadorId: z.string().min(1),
  split: z.record(z.string(), z.number().min(0).max(100)),
  visitaId: z.string().optional(),
});

export const categorySchema = z.object({
  nome: z.string().min(1, "Nome obrigatório").max(50),
  icone: z.string().min(1, "Ícone obrigatório"),
});

export const guestSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório").max(100),
  hostId: z.string().min(1),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato: YYYY-MM-DD"),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato: YYYY-MM-DD"),
});

export const recurringSchema = z.object({
  descricao: z.string().min(1).max(200),
  valor: z.number().int().positive(),
  categoriaId: z.string().min(1),
  split: z.record(z.string(), z.number().min(0).max(100)),
  ativo: z.boolean(),
});
