import { PlaceholderPage } from "@/components/dashboard/placeholder-page";

export default function CategoriesPage() {
  return (
    <PlaceholderPage
      eyebrow="Fase 2.4"
      title="Categorias prontas para sair do seed e virar interface."
      description="As categorias já existem no banco. O próximo passo é dar uma tela para listar, criar e ajustar o conjunto que sustenta o dashboard."
      bullets={[
        "Lista com nome e ícone, mantendo leitura limpa no mobile.",
        "Criação e edição sem sair do fluxo principal do app.",
        "Base para relatórios por categoria nas fases seguintes.",
      ]}
    />
  );
}