import { connectDB } from "@/lib/mongodb";
import { Invoice } from "@/lib/models/Invoice";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    await connectDB();
    const invoices = await Invoice.find().sort({ createdAt: -1 }).lean();
    return jsonOk(invoices);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load invoices", 500);
  }
}
