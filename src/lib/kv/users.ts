import { getJSON, setJSON } from "@/lib/redis";
import type { User } from "@/types";

const defaultUserIds = ["user-1", "user-2"];

export async function getUserById(id: string): Promise<User | null> {
  return getJSON<User>(`users:${id}`);
}

export async function setUser(user: User): Promise<void> {
  await setJSON(`users:${user.id}`, user);
  const usersList = (await getJSON<string[]>("users-list")) ?? defaultUserIds;
  if (!usersList.includes(user.id)) {
    usersList.push(user.id);
    await setJSON("users-list", usersList);
  }
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

export async function getResidents(): Promise<User[]> {
  const users = await getAllUsers();
  return users.filter((user) => user.role !== "admin");
}

export async function getDefaultUsers(): Promise<User[]> {
  // Maintaining for backwards compatibility with split logic
  const users = await Promise.all(defaultUserIds.map((id) => getUserById(id)));
  return users.filter((user): user is User => user !== null);
}

export async function getAllUsers(): Promise<User[]> {
  const usersList = (await getJSON<string[]>("users-list")) ?? defaultUserIds;
  const users = await Promise.all(usersList.map((id) => getUserById(id)));
  return users.filter((user): user is User => user !== null);
}

export async function deleteUser(id: string): Promise<void> {
  // Note: we'd also need to delete the user's email from the emailIndex
  // For now we just remove from users-list
  const usersList = (await getJSON<string[]>("users-list")) ?? defaultUserIds;
  const filtered = usersList.filter((userId) => userId !== id);
  await setJSON("users-list", filtered);
}
