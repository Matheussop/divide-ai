import "dotenv/config";
import { hash } from "bcryptjs";
import { getJSON, setJSON } from "../src/lib/redis";
import type { User } from "../src/types";

async function injectAdmin() {
  console.log("🛡️ Injetando usuário Admin e atualizando papéis...");

  // 1. Pegar a lista atual de usuários ou usar o padrão
  const usersList = (await getJSON<string[]>("users-list")) ?? ["user-1", "user-2"];
  const emailIndex = (await getJSON<Record<string, string>>("user-emails")) ?? {};

  // 2. Garantir que os usuários atuais tenham a role "user"
  for (const userId of usersList) {
    const user = await getJSON<User>(`users:${userId}`);
    if (user && !user.role) {
      user.role = "user";
      await setJSON(`users:${userId}`, user);
      console.log(`  ✅ Atualizado role de ${user.nome} para 'user'`);
    }
  }

  // 3. Criar o usuário Admin
  const adminId = "admin-1";
  const adminEmail = "admin@divide.ai";
  const passwordHash = await hash("admin", 12);

  const adminUser: User = {
    id: adminId,
    nome: "Admin do Sistema",
    email: adminEmail,
    passwordHash,
    role: "admin",
  };

  await setJSON(`users:${adminId}`, adminUser);
  console.log(`  ✅ Criado Admin: ${adminUser.nome} (${adminEmail})`);

  // 4. Atualizar índices
  emailIndex[adminEmail] = adminId;
  await setJSON("user-emails", emailIndex);

  if (!usersList.includes(adminId)) {
    usersList.push(adminId);
    await setJSON("users-list", usersList);
  }

  console.log("\n✨ Injeção completa!");
  console.log("\nVocê já pode logar com:");
  console.log("  admin@divide.ai / admin");

  process.exit(0);
}

injectAdmin().catch((err) => {
  console.error("❌ Erro na injeção:", err);
  process.exit(1);
});
