"use client";

import { useState } from "react";
import { Shield, ShieldAlert, UserCog, Pencil, Trash2, Plus } from "lucide-react";
import { createUserAction, updateUserAction, deleteUserAction } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

interface UsersManagerProps {
  users: User[];
  currentUserId: string;
}

interface UserFormState {
  nome: string;
  email: string;
  password?: string;
  role: "admin" | "user";
}

const emptyState: UserFormState = {
  nome: "",
  email: "",
  password: "",
  role: "user",
};

export function UsersManager({ users, currentUserId }: UsersManagerProps) {
  const [form, setForm] = useState<UserFormState>(emptyState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  function resetForm() {
    setForm(emptyState);
    setEditingId(null);
    setFeedback("");
  }

  function handleEdit(user: User) {
    setEditingId(user.id);
    setFeedback("");
    setForm({
      nome: user.nome,
      email: user.email,
      password: "", // We never populate the password field
      role: user.role ?? "user",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este usuário? (Esta ação não remove suas despesas vinculadas)")) {
      return;
    }
    setSubmitting(true);
    setFeedback("");
    const result = await deleteUserAction(id);
    if (!result.success) setFeedback(result.error ?? "Erro ao excluir.");
    setSubmitting(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback("");

    let result;
    if (editingId) {
      result = await updateUserAction({ id: editingId, ...form });
    } else {
      result = await createUserAction(form);
    }

    if (result.success) {
      resetForm();
    } else {
      setFeedback(result.error ?? "Erro ao salvar usuário.");
    }
    setSubmitting(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      {/* Form Card */}
      <Card className="rounded-[1.75rem] border border-border/60 bg-card/90 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)]">
        <CardHeader>
          <CardTitle className="text-lg tracking-[-0.03em]">
            {editingId ? "Editar Usuário" : "Novo Usuário"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha {editingId && "(deixe em branco para manter)"}</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editingId}
                placeholder={editingId ? "********" : "Digite uma senha"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Permissão</Label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "user" })}
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="user">Usuário Comum</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            {feedback && (
              <p className="text-sm font-medium text-destructive">{feedback}</p>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "Salvando..." : editingId ? "Atualizar" : "Criar Usuário"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List Card */}
      <Card className="rounded-[1.75rem] border border-border/60 bg-card/90 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg tracking-[-0.03em]">
            <UserCog className="size-5" />
            Usuários Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum usuário.</p>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/60 bg-background/70 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex size-10 items-center justify-center rounded-full border",
                      user.role === "admin" 
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "border-primary/20 bg-primary/10 text-primary"
                    )}>
                      {user.role === "admin" ? <ShieldAlert className="size-5" /> : <Shield className="size-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        {user.nome}
                        {user.id === currentUserId && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                            Você
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(user)}
                      className="size-8 rounded-full"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(user.id)}
                      disabled={user.id === currentUserId}
                      className="size-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
