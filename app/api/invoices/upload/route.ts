import { connectDB } from "@/lib/mongodb";
import { Invoice } from "@/lib/models/Invoice";
import { extractInvoiceFromFile, extractInvoiceFromText } from "@/lib/extract-invoice";
import { jsonError, jsonOk } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    let vendor = "";
    let fileName = "";
    let extractedLines: Awaited<
      ReturnType<typeof extractInvoiceFromFile>
    >["lines"] = [];

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      const pastedText = form.get("text");
      vendor = String(form.get("vendor") ?? "").trim();

      if (typeof pastedText === "string" && pastedText.trim()) {
        const result = await extractInvoiceFromText(pastedText.trim());
        vendor = vendor || result.vendor || "";
        extractedLines = result.lines;
        fileName = "pasted-invoice.txt";
      } else if (file instanceof File) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await extractInvoiceFromFile(
          buffer,
          file.type || "application/octet-stream",
          file.name,
        );
        vendor = vendor || result.vendor || "";
        extractedLines = result.lines;
        fileName = file.name;
      } else {
        return jsonError("Upload a file or paste invoice text");
      }
    } else {
      return jsonError("Expected multipart form data");
    }

    await connectDB();
    const invoice = await Invoice.create({
      vendor,
      fileName,
      status: "processed",
      extractedLines: extractedLines.map((line) => ({
        ...line,
        vendor: line.vendor ?? vendor,
        applied: false,
      })),
    });

    return jsonOk(invoice, 201);
  } catch (e) {
    await connectDB().catch(() => undefined);
    try {
      await Invoice.create({
        status: "failed",
        errorMessage: e instanceof Error ? e.message : "Extraction failed",
      });
    } catch {
      // ignore secondary failure
    }
    return jsonError(
      e instanceof Error ? e.message : "Invoice extraction failed",
      500,
    );
  }
}
