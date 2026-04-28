import { kv } from "@vercel/kv";
import type { User } from "@/types";

export async function getUserById(id: string): Promise<User | null> {
  return kv.get<User>(`users:${id}`);
}

export async function setUser(user: User): Promise<void> {
  await kv.set(`users:${user.id}`, user);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const emailIndex = await kv.get<Record<string, string>>("user-emails");
  if (!emailIndex) return null;

  const userId = emailIndex[email];
  if (!userId) return null;

  return getUserById(userId);
}

export async function setUserEmailIndex(
  email: string,
  userId: string
): Promise<void> {
  const emailIndex =
    (await kv.get<Record<string, string>>("user-emails")) ?? {};
  emailIndex[email] = userId;
  await kv.set("user-emails", emailIndex);
}
