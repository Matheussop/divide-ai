import { getJSON, setJSON } from "@/lib/redis";
import type { Guest } from "@/types";

const key = (month: string) => `guests:${month}`;

export async function getGuests(month: string): Promise<Guest[]> {
  return (await getJSON<Guest[]>(key(month))) ?? [];
}

export async function setGuests(
  month: string,
  guests: Guest[]
): Promise<void> {
  await setJSON(key(month), guests);
}

export async function addGuest(month: string, guest: Guest): Promise<void> {
  const guests = await getGuests(month);
  guests.push(guest);
  await setGuests(month, guests);
}

export async function updateGuest(
  month: string,
  id: string,
  data: Partial<Guest>
): Promise<Guest | null> {
  const guests = await getGuests(month);
  const index = guests.findIndex((g) => g.id === id);
  if (index === -1) return null;

  guests[index] = { ...guests[index], ...data };
  await setGuests(month, guests);
  return guests[index];
}

export async function deleteGuest(
  month: string,
  id: string
): Promise<boolean> {
  const guests = await getGuests(month);
  const filtered = guests.filter((g) => g.id !== id);
  if (filtered.length === guests.length) return false;

  await setGuests(month, filtered);
  return true;
}
