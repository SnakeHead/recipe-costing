import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureDb } from "@/lib/db-ready";
import { SetupRequired } from "@/components/SetupRequired";
import { Recipe } from "@/lib/models/Recipe";
import { Client } from "@/lib/models/Client";
import { RecipeForm } from "@/components/RecipeForm";
import { Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditRecipePage({ params }: Props) {
  const { id } = await params;
  if (!(await ensureDb())) {
    return (
      <div>
        <PageHeader title="Edit recipe" />
        <SetupRequired />
      </div>
    );
  }

  const recipe = await Recipe.findById(id).lean();
  if (!recipe) notFound();

  const client = await Client.findById(recipe.clientId).lean();
  const clientId = String(recipe.clientId);

  return (
    <div>
      <PageHeader
        title={`Edit — ${recipe.name}`}
        description={client ? `Client: ${client.name}` : undefined}
      />
      <p className="mb-4 text-sm">
        <Link
          href={`/recipes/${id}`}
          className="text-emerald-700 hover:underline"
        >
          ← Back to recipe
        </Link>
      </p>
      <Card>
        <RecipeForm
          clientId={clientId}
          recipeId={id}
          initial={{
            name: recipe.name,
            rawText: recipe.rawText ?? "",
            lines: recipe.lines.map((line) => ({
              ingredientName: line.ingredientName,
              quantity: line.quantity,
              unit: line.unit,
              vendor: line.vendor ?? undefined,
              brand: line.brand ?? undefined,
              costPerPound: line.costPerPound ?? undefined,
              lineCost: line.lineCost ?? undefined,
              matchNote: line.matchNote ?? undefined,
            })),
            totalCost: recipe.totalCost ?? 0,
          }}
        />
      </Card>
    </div>
  );
}
