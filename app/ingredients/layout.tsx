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
        description="Track distributor pricing and volume-to-weight conversions for recipe costing."
      />
      <IngredientsTabs />
      {children}
    </div>
  );
}
