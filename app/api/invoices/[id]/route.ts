import { connectDB } from "@/lib/mongodb";
import { Invoice } from "@/lib/models/Invoice";
import { jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    await connectDB();
    const invoice = await Invoice.findById(id).lean();
    if (!invoice) return jsonError("Invoice not found", 404);
    return jsonOk(invoice);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load invoice", 500);
  }
}
