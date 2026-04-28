import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAllUsers } from "@/lib/kv/users";
import { UsersManager } from "@/components/dashboard/users-manager";

export default async function UsuariosPage() {
  const session = await auth();
  
  if (!session?.user || session.user.role !== "admin") {
    redirect("/"); // Somente admins
  }

  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.15),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,255,255,0.8))] p-6 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)] dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.15),transparent_24%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.88))]">
        <h1 className="text-3xl font-semibold tracking-tighter text-foreground sm:text-4xl">
          Gerenciar Usuários
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Adicione, edite ou remova usuários do sistema. Apenas administradores têm acesso a esta área.
        </p>
      </section>

      <UsersManager users={users} currentUserId={session.user.id} />
    </div>
  );
}
