import { IngredientProduct } from "@/lib/models/IngredientProduct";
import { IngredientWeightConversion } from "@/lib/models/IngredientWeightConversion";
import { ensureDb } from "@/lib/db-ready";
import { SetupRequired } from "@/components/SetupRequired";
import { IngredientCatalog } from "@/components/IngredientCatalog";
import { WeightConversionImport } from "@/components/WeightConversionImport";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function IngredientsPage({ searchParams }: Props) {
  const { q } = await searchParams;
  if (!(await ensureDb())) {
    return (
      <div>
        <PageHeader title="Ingredients & vendors" />
        <SetupRequired />
      </div>
    );
  }

  const [ingredients, conversionCount] = await Promise.all([
    IngredientProduct.find({}).sort({ name: 1, vendor: 1 }).lean(),
    IngredientWeightConversion.countDocuments(),
  ]);

  return (
    <div>
      <PageHeader
        title="Ingredients"
        description="Track pricing by distributor (vendor), product brand, and pack size. The same ingredient can have multiple brands and prices from one vendor."
      />
      <WeightConversionImport initialCount={conversionCount} />
      <IngredientCatalog
        initial={ingredients.map((i) => ({
          _id: String(i._id),
          name: i.name,
          vendor: i.vendor,
          brand: i.brand ?? "",
          unitsPerPack: i.unitsPerPack,
          unitSize: i.unitSize ?? "",
          weightUnit: i.weightUnit as "lb" | "oz" | "kg" | "g",
          packPrice: i.packPrice,
          costPerPound: i.costPerPound ?? undefined,
        }))}
        initialQuery={q ?? ""}
      />
    </div>
  );
}
