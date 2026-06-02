import { buildVendorSpreadsheetTemplate } from "@/lib/parse-vendor-spreadsheet";

export async function GET() {
  const buffer = buildVendorSpreadsheetTemplate();

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="vendor-pricing-template.xlsx"',
    },
  });
}
