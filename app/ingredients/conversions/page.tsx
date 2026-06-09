import { IngredientWeightConversion } from "@/lib/models/IngredientWeightConversion";
import { ensureDb } from "@/lib/db-ready";
import { SetupRequired } from "@/components/SetupRequired";
import { WeightConversionCatalog } from "@/components/WeightConversionCatalog";
import { WeightConversionImport } from "@/components/WeightConversionImport";
export const dynamic = "force-dynamic";

export default async function IngredientConversionsPage() {
  if (!(await ensureDb())) {
    return <SetupRequired />;
  }

  const conversions = await IngredientWeightConversion.find()
    .sort({ ingredientName: 1, measureUnit: 1 })
    .lean();

  return (
    <div>
      <WeightConversionImport initialCount={conversions.length} />
      <WeightConversionCatalog
        initial={conversions.map((row) => ({
          _id: String(row._id),
          ingredientName: row.ingredientName,
          measureQuantity: row.measureQuantity,
          measureUnit: row.measureUnit,
          pounds: row.pounds,
        }))}
      />
    </div>
  );
}
