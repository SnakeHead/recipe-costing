import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureDb } from "@/lib/db-ready";
import { SetupRequired } from "@/components/SetupRequired";
import { Invoice } from "@/lib/models/Invoice";
import { InvoiceReview } from "@/components/InvoiceReview";
import { Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  if (!(await ensureDb())) {
    return (
      <div>
        <PageHeader title="Invoice" />
        <SetupRequired />
      </div>
    );
  }

  const invoice = await Invoice.findById(id).lean();
  if (!invoice) notFound();

  return (
    <div>
      <PageHeader
        title="Review extracted invoice"
        description={`${invoice.vendor || "Vendor"} · ${invoice.fileName}`}
      />
      <p className="mb-4 text-sm">
        <Link href="/invoices" className="text-emerald-700 hover:underline">
          ← All invoices
        </Link>
      </p>

      {invoice.status === "failed" ? (
        <Card>
          <p className="text-red-600">{invoice.errorMessage ?? "Extraction failed"}</p>
        </Card>
      ) : (
        <Card>
          <InvoiceReview
            invoiceId={id}
            vendor={invoice.vendor ?? ""}
            lines={invoice.extractedLines.map((l) => ({
              productName: l.productName,
              vendor: l.vendor ?? undefined,
              unitsPerPack: l.unitsPerPack ?? undefined,
              unitSize: l.unitSize ?? undefined,
              weightUnit: (l.weightUnit ?? undefined) as
                | "lb"
                | "oz"
                | "kg"
                | "g"
                | undefined,
              packPrice: l.packPrice ?? undefined,
              lineTotal: l.lineTotal ?? undefined,
              applied: l.applied,
            }))}
          />
        </Card>
      )}
    </div>
  );
}
