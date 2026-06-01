import Link from "next/link";
import { ensureDb } from "@/lib/db-ready";
import { SetupRequired } from "@/components/SetupRequired";
import { Invoice } from "@/lib/models/Invoice";
import { InvoiceUploadForm } from "@/components/InvoiceUploadForm";
import { Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  if (!(await ensureDb())) {
    return (
      <div>
        <PageHeader title="Distributor invoices" />
        <SetupRequired />
      </div>
    );
  }
  const invoices = await Invoice.find().sort({ createdAt: -1 }).limit(20).lean();

  return (
    <div>
      <PageHeader
        title="Distributor invoices"
        description="Upload or paste invoices. AI extracts line items to update ingredient pricing."
      />

      <Card className="mb-8">
        <InvoiceUploadForm />
      </Card>

      <h2 className="mb-4 text-lg font-semibold">Recent uploads</h2>
      {invoices.length === 0 ? (
        <p className="text-sm text-stone-600">No invoices uploaded yet.</p>
      ) : (
        <ul className="space-y-2">
          {invoices.map((inv) => (
            <li key={String(inv._id)}>
              <Link
                href={`/invoices/${inv._id}`}
                className="block rounded-lg border border-stone-200 bg-white px-4 py-3 hover:border-emerald-300"
              >
                <span className="font-medium">
                  {inv.vendor || "Invoice"} — {inv.fileName || "upload"}
                </span>
                <span className="ml-2 text-sm text-stone-500">
                  {inv.extractedLines.length} lines · {inv.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
