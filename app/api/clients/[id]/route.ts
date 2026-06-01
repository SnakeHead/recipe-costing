import { connectDB } from "@/lib/mongodb";
import { Client } from "@/lib/models/Client";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    await connectDB();
    const client = await Client.findById(id).lean();
    if (!client) return jsonError("Client not found", 404);
    return jsonOk(client);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load client", 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await parseJsonBody<{
    name?: string;
    companyName?: string;
    phone?: string;
    email?: string;
  }>(request);

  try {
    await connectDB();
    const client = await Client.findByIdAndUpdate(
      id,
      {
        ...(body?.name !== undefined && { name: body.name.trim() }),
        ...(body?.companyName !== undefined && {
          companyName: body.companyName.trim(),
        }),
        ...(body?.phone !== undefined && { phone: body.phone.trim() }),
        ...(body?.email !== undefined && { email: body.email.trim() }),
      },
      { new: true, runValidators: true },
    ).lean();
    if (!client) return jsonError("Client not found", 404);
    return jsonOk(client);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to update client", 500);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    await connectDB();
    const client = await Client.findByIdAndDelete(id);
    if (!client) return jsonError("Client not found", 404);
    return jsonOk({ ok: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to delete client", 500);
  }
}
