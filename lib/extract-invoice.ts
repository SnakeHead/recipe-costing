import OpenAI from "openai";
import { z } from "zod";
import type { ExtractedInvoiceLine } from "./types";

const extractionSchema = z.object({
  vendor: z.string().optional(),
  lines: z.array(
    z.object({
      productName: z.string(),
      vendor: z.string().optional(),
      brand: z.string().optional(),
      unitsPerPack: z.number().optional(),
      weightPerUnit: z.number().optional(),
      weightUnit: z.enum(["lb", "oz", "kg", "g"]).optional(),
      packPrice: z.number().optional(),
      quantityOrdered: z.number().optional(),
      lineTotal: z.number().optional(),
    }),
  ),
});

const SYSTEM_PROMPT = `You extract structured ingredient pricing from food-service distributor invoices.
For each line item, infer when possible:
- productName (ingredient name)
- unitsPerPack (how many units in the case/pack, e.g. 6 for "6/10#")
- weightPerUnit and weightUnit (e.g. 10 lb per unit)
- packPrice or lineTotal (use line total if pack price unclear)
- vendor: distributor on the invoice (header), not the product brand
- brand: product brand when shown on the line (e.g. Heinz)

Food distributors often use shorthand like "6/10#" meaning 6 units of 10 pounds each.
Return JSON only matching the schema. Use weightUnit "lb" when unspecified.`;

export async function extractInvoiceFromText(
  text: string,
): Promise<{ vendor?: string; lines: ExtractedInvoiceLine[] }> {
  const client = getOpenAI();
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Extract ingredient pricing from this invoice text:\n\n${text}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from AI");

  const parsed = extractionSchema.parse(JSON.parse(content));
  return {
    vendor: parsed.vendor,
    lines: parsed.lines,
  };
}

export async function extractInvoiceFromFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<{ vendor?: string; lines: ExtractedInvoiceLine[] }> {
  const client = getOpenAI();

  if (mimeType.startsWith("text/") || fileName.endsWith(".txt")) {
    return extractInvoiceFromText(buffer.toString("utf-8"));
  }

  const isPdf = mimeType === "application/pdf" || fileName.endsWith(".pdf");
  if (isPdf) {
    throw new Error(
      "PDF upload is not supported yet. Paste invoice text below or upload a PNG/JPG image.",
    );
  }

  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract all ingredient line items and pricing from this distributor invoice.",
          },
          {
            type: "image_url",
            image_url: { url: dataUrl },
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from AI");

  const parsed = extractionSchema.parse(JSON.parse(content));
  return {
    vendor: parsed.vendor,
    lines: parsed.lines,
  };
}

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for invoice extraction");
  }
  return new OpenAI({ apiKey });
}
