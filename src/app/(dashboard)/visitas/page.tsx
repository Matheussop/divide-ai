import { GuestsManager } from "@/components/dashboard/guests-manager";
import { getGuests } from "@/lib/kv/guests";
import { getDefaultUsers } from "@/lib/kv/users";

function getMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export default async function GuestsPage() {
  const monthKey = getMonthKey();
  const [guests, users] = await Promise.all([
    getGuests(monthKey),
    getDefaultUsers(),
  ]);

  return (
    <GuestsManager
      monthLabel={formatMonthLabel(monthKey)}
      guests={guests}
      users={users}
    />
  );
}
