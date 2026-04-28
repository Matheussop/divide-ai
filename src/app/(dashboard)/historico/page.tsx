import { PlaceholderPage } from "@/components/dashboard/placeholder-page";

export default function HistoryPage() {
  return (
    <PlaceholderPage
      eyebrow="Fase 2.6"
      title="Histórico mensal vai costurar a memória financeira do apê."
      description="O dashboard já reconhece o mês atual e a contagem de meses com dados. Esta seção será a ponte para navegar entre períodos."
      bullets={[
        "Seletor de mês com leitura de dados diretamente do Redis.",
        "Reaproveitamento da visualização mensal para meses anteriores.",
        "Base para saldo acumulado e relatórios completos nas próximas fases.",
      ]}
    />
  );
}
