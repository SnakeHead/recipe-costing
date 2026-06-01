import Link from "next/link";
import { Client } from "@/lib/models/Client";
import { ensureDb } from "@/lib/db-ready";
import { SetupRequired } from "@/components/SetupRequired";
import { PageHeader, Button, Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  if (!(await ensureDb())) {
    return (
      <div>
        <PageHeader title="Clients" />
        <SetupRequired />
      </div>
    );
  }
  const clients = await Client.find().sort({ name: 1 }).lean();

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Restaurant and catering clients whose recipes you cost out."
        action={
          <Link href="/clients/new">
            <Button>Add client</Button>
          </Link>
        }
      />

      {clients.length === 0 ? (
        <Card>
          <p className="text-stone-600">No clients yet.</p>
          <Link href="/clients/new" className="mt-4 inline-block">
            <Button>Create your first client</Button>
          </Link>
        </Card>
      ) : (
        <ul className="space-y-3">
          {clients.map((client) => (
            <li key={String(client._id)}>
              <Link href={`/clients/${client._id}`}>
                <Card className="block transition hover:border-emerald-300">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold">{client.name}</h2>
                      {client.companyName && (
                        <p className="text-sm text-stone-600">
                          {client.companyName}
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-stone-500">
                      {client.email && <p>{client.email}</p>}
                      {client.phone && <p>{client.phone}</p>}
                    </div>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
