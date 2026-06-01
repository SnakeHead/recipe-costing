import { connectDB } from "@/lib/mongodb";
import { Client } from "@/lib/models/Client";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";

export async function GET() {
  try {
    await connectDB();
    const clients = await Client.find().sort({ name: 1 }).lean();
    return jsonOk(clients);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load clients", 500);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<{
    name?: string;
    companyName?: string;
    phone?: string;
    email?: string;
  }>(request);

  if (!body?.name?.trim()) {
    return jsonError("Client name is required");
  }

  try {
    await connectDB();
    const client = await Client.create({
      name: body.name.trim(),
      companyName: body.companyName?.trim() ?? "",
      phone: body.phone?.trim() ?? "",
      email: body.email?.trim() ?? "",
    });
    return jsonOk(client, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to create client", 500);
  }
}
