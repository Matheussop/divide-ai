import { ArrowUpRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlaceholderPageProps {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
}

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  bullets,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,255,255,0.78))] p-6 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.45)] dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_28%),linear-gradient(180deg,rgba(17,24,39,0.96),rgba(17,24,39,0.88))]">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
          <Sparkles className="size-3.5" />
          {eyebrow}
        </div>
        <h1 className="max-w-sm text-3xl font-semibold tracking-[-0.04em] text-foreground">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </section>

      <Card className="rounded-[1.75rem] border border-border/60 bg-card/90 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.38)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg tracking-[-0.03em]">
            <ArrowUpRight className="size-4 text-amber-600 dark:text-amber-400" />
            Próxima entrega desta seção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {bullets.map((bullet) => (
              <li
                key={bullet}
                className="rounded-2xl border border-border/50 bg-background/70 px-4 py-3"
              >
                {bullet}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}