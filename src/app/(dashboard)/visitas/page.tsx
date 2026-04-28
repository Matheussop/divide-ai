import { GuestsManager } from "@/components/dashboard/guests-manager";
import { getGuests } from "@/lib/kv/guests";
import { getDefaultUsers } from "@/lib/kv/users";
import { formatMonthLabel, resolveMonthKey } from "@/lib/month";

type GuestsPageProps = {
  searchParams?: {
    mes?: string;
  };
};

export default async function GuestsPage({ searchParams }: GuestsPageProps) {
  const monthKey = resolveMonthKey(searchParams?.mes);
  const [guests, users] = await Promise.all([
    getGuests(monthKey),
    getDefaultUsers(),
  ]);

  return (
    <GuestsManager
      monthKey={monthKey}
      monthLabel={formatMonthLabel(monthKey)}
      guests={guests}
      users={users}
    />
  );
}
