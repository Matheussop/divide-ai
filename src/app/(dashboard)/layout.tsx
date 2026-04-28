import { auth } from "@/lib/auth";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "morador";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.08),transparent_30%),linear-gradient(180deg,rgba(248,250,252,1),rgba(241,245,249,1))] pb-28 dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_26%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.08),transparent_20%),linear-gradient(180deg,rgba(2,6,23,1),rgba(15,23,42,1))]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-8 pt-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground backdrop-blur">
              DivideAí
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tighter text-foreground sm:text-3xl">
              Bom te ver, {firstName}.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Seu painel mensal começa aqui.
            </p>
          </div>
          <div className="hidden md:block">
            <SignOutButton />
          </div>
        </header>

        <DashboardNav className="mb-6 hidden md:block" />

        <main className="flex-1">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}
