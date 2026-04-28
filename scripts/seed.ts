import { kv } from "@vercel/kv";
import { hash } from "bcryptjs";
import type { User, Category } from "../src/types";

async function seed() {
  console.log("🌱 Seeding database...");

  // Usuários
  const users: Array<Omit<User, "passwordHash"> & { password: string }> = [
    {
      id: "user-1",
      nome: "Morador 1",
      email: "morador1@divide.ai",
      password: "123456",
    },
    {
      id: "user-2",
      nome: "Morador 2",
      email: "morador2@divide.ai",
      password: "123456",
    },
  ];

  const emailIndex: Record<string, string> = {};

  for (const u of users) {
    const passwordHash = await hash(u.password, 12);
    const user: User = {
      id: u.id,
      nome: u.nome,
      email: u.email,
      passwordHash,
    };
    await kv.set(`users:${user.id}`, user);
    emailIndex[user.email] = user.id;
    console.log(`  ✅ User: ${user.nome} (${user.email})`);
  }

  await kv.set("user-emails", emailIndex);

  // Categorias padrão
  const categories: Category[] = [
    { id: "cat-1", nome: "Aluguel", icone: "home" },
    { id: "cat-2", nome: "Mercado", icone: "shopping-cart" },
    { id: "cat-3", nome: "Internet", icone: "wifi" },
    { id: "cat-4", nome: "Energia", icone: "zap" },
    { id: "cat-5", nome: "Água", icone: "droplets" },
    { id: "cat-6", nome: "Lazer", icone: "gamepad-2" },
    { id: "cat-7", nome: "Outros", icone: "package" },
    { id: "cat-8", nome: "Acerto", icone: "handshake" },
  ];

  await kv.set("categories", categories);
  console.log(`  ✅ ${categories.length} categorias criadas`);

  // Templates recorrentes iniciais
  await kv.set("recurring", []);
  await kv.set("months-with-data", []);

  console.log("\n✨ Seed completo!");
  console.log("\nCredenciais:");
  console.log("  morador1@divide.ai / 123456");
  console.log("  morador2@divide.ai / 123456");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Erro no seed:", err);
  process.exit(1);
});
