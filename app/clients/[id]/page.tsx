import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureDb } from "@/lib/db-ready";
import { SetupRequired } from "@/components/SetupRequired";
import { Client } from "@/lib/models/Client";
import { Recipe } from "@/lib/models/Recipe";
import { ClientForm } from "@/components/ClientForm";
import { formatMoney } from "@/lib/costing";
import { Card, PageHeader, Button } from "@/components/ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  if (!(await ensureDb())) {
    return (
      <div>
        <PageHeader title="Client" />
        <SetupRequired />
      </div>
    );
  }

  const client = await Client.findById(id).lean();
  if (!client) notFound();

  const recipes = await Recipe.find({ clientId: id }).sort({ updatedAt: -1 }).lean();

  return (
    <div>
      <PageHeader
        title={client.name}
        description={client.companyName || undefined}
        action={
          <Link href={`/clients/${id}/recipes/new`}>
            <Button>Add recipe</Button>
          </Link>
        }
      />

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Contact</h2>
          <ClientForm
            clientId={id}
            initial={{
              name: client.name,
              companyName: client.companyName ?? "",
              phone: client.phone ?? "",
              email: client.email ?? "",
            }}
          />
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Recipes</h2>
          {recipes.length === 0 ? (
            <p className="text-sm text-stone-600">No recipes for this client yet.</p>
          ) : (
            <ul className="space-y-2">
              {recipes.map((recipe) => (
                <li key={String(recipe._id)}>
                  <Link
                    href={`/recipes/${recipe._id}`}
                    className="flex items-center justify-between rounded-lg border border-stone-100 px-3 py-2 hover:bg-stone-50"
                  >
                    <span className="font-medium">{recipe.name}</span>
                    <span className="text-sm font-semibold text-emerald-800">
                      {formatMoney(recipe.totalCost ?? 0)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
