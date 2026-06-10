import { ensureDb } from "@/lib/db-ready";
import { SetupRequired } from "@/components/SetupRequired";
import { IngredientSpreadsheetImport } from "@/components/IngredientSpreadsheetImport";

export const dynamic = "force-dynamic";

export default async function IngredientImportPage() {
  if (!(await ensureDb())) {
    return <SetupRequired />;
  }

  return <IngredientSpreadsheetImport />;
}
