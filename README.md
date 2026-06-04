# Recipe Costing

Cost client recipes using ingredient prices from your food-service distributors (e.g. Ben E. Keith). Built with Next.js 16, MongoDB Atlas, and OpenAI for invoice extraction.

## Features

- **Clients** — name, company, phone, email
- **Recipes** — paste or upload ingredient lists with weights; automatic line-item costing
- **Ingredients** — vendor-specific pack pricing (pack × unit size → cost per pound when numeric)
- **Excel import** — bulk upload vendor pricing from `.xlsx`, `.xls`, or `.csv`
- **Invoices** — upload or paste distributor invoices; AI extracts prices into your ingredient database

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Configure [MongoDB Atlas](https://www.mongodb.com/cloud/atlas):
   - Create a free cluster
   - Database Access → create a user
   - Network Access → allow your IP (or `0.0.0.0/0` for development)
   - Connect → copy the connection string into `MONGODB_URI`

4. Add an [OpenAI API key](https://platform.openai.com/api-keys) for invoice scanning (`OPENAI_API_KEY`).

5. Run the dev server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

## Workflow

1. **Ingredients** — Add ketchup from Ben E. Keith: 6 units × 10 lb @ $75.23 → **$1.25/lb**, or **Import from Excel** with the downloadable template.
2. **Invoices** (optional) — Upload an image or paste invoice text to import many items at once.
3. **Clients** — Create a client, then **Add recipe** and paste lines like `Ketchup, 3.4 lb`.
4. **Preview costs** — 3.4 lb × $1.25/lb = **$4.26** per line; save to store the recipe.

## Excel vendor pricing

On **Ingredients**, use **Import from Excel** or download the template (`/api/ingredients/import/template`).

Columns left to right:

| Item # | Pack | Size | Unit | Brand | Item Name | Price |
|--------|------|------|------|-------|-----------|-------|
| KECH-001 | 6 | 10 | lb | Heinz | Ketchup | 75.23 |

Set the **distributor (vendor)** on the import form (e.g. Sysco) — it is not a column in the file. **Brand** is the product label (Heinz, etc.).

Older column names, an optional Vendor column, and pack shorthand (`6/10#`) still work.

Imports match on **vendor + Item #** when Item # is present; otherwise **name + vendor + brand**. Rows with the same name but different item numbers are separate products.

On first connect after an upgrade, legacy database indexes are removed automatically.

## Recipe text formats

- `Ketchup, 3.4 lb`
- `3.4 lb Ketchup`
- Tab-separated: `Ketchup\t3.4 lb`

## Cost formula

```
total pack weight = unitsPerPack × numeric unit size (converted to lb); descriptive sizes like `#10 can` are stored but may not compute $/lb
cost per pound = packPrice ÷ total pack weight
line cost = recipe quantity (in lb) × cost per pound
```

## Tech stack

- Next.js App Router · React 19 · Tailwind CSS 4
- MongoDB Atlas via Mongoose
- OpenAI API for invoice extraction
