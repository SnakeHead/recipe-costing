import { IngredientsTabs } from "@/components/IngredientsTabs";
import { PageHeader } from "@/components/ui";

export default function IngredientsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <PageHeader
        title="Ingredients"
        description="Search pricing, import distributor spreadsheets, and manage volume-to-weight conversions."
      />
      <IngredientsTabs />
      {children}
    </div>
  );
}
