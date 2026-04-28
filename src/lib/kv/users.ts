import { getJSON, setJSON } from "@/lib/redis";
import type { User } from "@/types";

const defaultUserIds = ["user-1", "user-2"];

export async function getUserById(id: string): Promise<User | null> {
  return getJSON<User>(`users:${id}`);
}

export async function setUser(user: User): Promise<void> {
  await setJSON(`users:${user.id}`, user);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const emailIndex = await getJSON<Record<string, string>>("user-emails");
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
    (await getJSON<Record<string, string>>("user-emails")) ?? {};
  emailIndex[email] = userId;
  await setJSON("user-emails", emailIndex);
}

export async function getDefaultUsers(): Promise<User[]> {
  const users = await Promise.all(defaultUserIds.map((id) => getUserById(id)));
  return users.filter((user): user is User => user !== null);
}
