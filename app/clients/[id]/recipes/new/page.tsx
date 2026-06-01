import { notFound } from "next/navigation";
import Link from "next/link";
import { ensureDb } from "@/lib/db-ready";
import { SetupRequired } from "@/components/SetupRequired";
import { Client } from "@/lib/models/Client";
import { RecipeForm } from "@/components/RecipeForm";
import { Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function NewRecipePage({ params }: Props) {
  const { id } = await params;
  if (!(await ensureDb())) {
    return (
      <div>
        <PageHeader title="New recipe" />
        <SetupRequired />
      </div>
    );
  }
  const client = await Client.findById(id).lean();
  if (!client) notFound();

  return (
    <div>
      <PageHeader
        title={`New recipe — ${client.name}`}
        description="Paste ingredients and weights, preview costs, then save."
      />
      <p className="mb-4 text-sm">
        <Link href={`/clients/${id}`} className="text-emerald-700 hover:underline">
          ← Back to client
        </Link>
      </p>
      <Card>
        <RecipeForm clientId={id} />
      </Card>
    </div>
  );
}
