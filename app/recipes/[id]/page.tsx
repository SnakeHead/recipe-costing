import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureDb } from "@/lib/db-ready";
import { SetupRequired } from "@/components/SetupRequired";
import { Recipe } from "@/lib/models/Recipe";
import { Client } from "@/lib/models/Client";
import { formatMoney } from "@/lib/costing";
import { Card, PageHeader } from "@/components/ui";
import { RecalculateRecipeButton } from "@/components/RecalculateRecipeButton";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function RecipeDetailPage({ params }: Props) {
  const { id } = await params;
  if (!(await ensureDb())) {
    return (
      <div>
        <PageHeader title="Recipe" />
        <SetupRequired />
      </div>
    );
  }

  const recipe = await Recipe.findById(id).lean();
  if (!recipe) notFound();

  const client = await Client.findById(recipe.clientId).lean();

  return (
    <div>
      <PageHeader
        title={recipe.name}
        description={client ? `Client: ${client.name}` : undefined}
        action={<RecalculateRecipeButton recipeId={id} />}
      />

      {client && (
        <p className="mb-4 text-sm">
          <Link
            href={`/clients/${client._id}`}
            className="text-emerald-700 hover:underline"
          >
            ← Back to {client.name}
          </Link>
        </p>
      )}

      <Card className="mb-6">
        <p className="text-sm text-stone-500">Total recipe cost</p>
        <p className="text-3xl font-semibold text-emerald-800">
          {formatMoney(recipe.totalCost ?? 0)}
        </p>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-600">
            <tr>
              <th className="px-4 py-3">Ingredient</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Brand / vendor</th>
              <th className="px-4 py-3">$/lb</th>
              <th className="px-4 py-3">Line cost</th>
            </tr>
          </thead>
          <tbody>
            {recipe.lines.map((line, i) => (
              <tr key={i} className="border-t border-stone-100">
                <td className="px-4 py-3">{line.ingredientName}</td>
                <td className="px-4 py-3">
                  {line.quantity} {line.unit}
                </td>
                <td className="px-4 py-3 text-stone-500">
                  {line.brand || line.vendor
                    ? [line.brand, line.vendor].filter(Boolean).join(" · ")
                    : (line.matchNote ?? "—")}
                </td>
                <td className="px-4 py-3">
                  {line.costPerPound != null
                    ? formatMoney(line.costPerPound)
                    : "—"}
                </td>
                <td className="px-4 py-3 font-medium">
                  {line.lineCost != null ? formatMoney(line.lineCost) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {recipe.rawText && (
        <Card className="mt-6">
          <h2 className="mb-2 font-semibold">Original recipe text</h2>
          <pre className="whitespace-pre-wrap text-sm text-stone-600">
            {recipe.rawText}
          </pre>
        </Card>
      )}
    </div>
  );
}
