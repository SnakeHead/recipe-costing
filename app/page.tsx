import Link from "next/link";
import { Client } from "@/lib/models/Client";
import { Recipe } from "@/lib/models/Recipe";
import { IngredientProduct } from "@/lib/models/IngredientProduct";
import { ensureDb } from "@/lib/db-ready";
import { SetupRequired } from "@/components/SetupRequired";
import { Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let stats = { clients: 0, recipes: 0, ingredients: 0 };
  const dbReady = await ensureDb();

  if (dbReady) {
    try {
      const [clients, recipes, ingredients] = await Promise.all([
        Client.countDocuments(),
        Recipe.countDocuments(),
        IngredientProduct.countDocuments(),
      ]);
      stats = { clients, recipes, ingredients };
    } catch {
      // connection failed
    }
  }

  return (
    <div>
      {!dbReady && (
        <div className="mb-8">
          <SetupRequired />
        </div>
      )}
      <PageHeader
        title="Recipe costing"
        description="Manage clients, ingredient costs from distributors, and cost out recipes line by line."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Clients", value: stats.clients, href: "/clients" },
          { label: "Recipes", value: stats.recipes, href: "/clients" },
          { label: "Ingredient prices", value: stats.ingredients, href: "/ingredients" },
        ].map((item) => (
          <Link key={item.label} href={item.href}>
            <Card className="transition hover:border-emerald-300 hover:shadow-md">
              <p className="text-sm text-stone-500">{item.label}</p>
              <p className="mt-1 text-3xl font-semibold text-emerald-800">
                {item.value}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Quick start</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-stone-600">
            <li>
              Add ingredients with vendor pack pricing (e.g. 6×10 lb ketchup @
              $75.23).
            </li>
            <li>Or scan a distributor invoice to import prices with AI.</li>
            <li>Create a client and paste their recipe to see line-item costs.</li>
          </ol>
        </Card>
        <Card>
          <h2 className="font-semibold">Example</h2>
          <p className="mt-2 text-sm text-stone-600">
            Ketchup from Ben E. Keith: 6 units × 10 lb = 60 lb per case at
            $75.23 → <strong>$1.25/lb</strong>. A recipe using{" "}
            <strong>3.4 lb</strong> costs <strong>$4.26</strong> for that line.
          </p>
          <Link
            href="/ingredients"
            className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline"
          >
            Manage ingredients →
          </Link>
        </Card>
      </div>
    </div>
  );
}
