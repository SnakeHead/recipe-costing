# Recipe Costing

Cost client recipes using ingredient prices from your food-service distributors (e.g. Ben E. Keith). Built with Next.js 16, MongoDB Atlas, and OpenAI for invoice extraction.

## Features

- **Clients** — name, company, phone, email
- **Recipes** — paste or upload ingredient lists with weights; automatic line-item costing
- **Ingredients** — vendor-specific pack pricing (units per pack × weight per unit → cost per pound)
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

| Column | Required | Examples |
|--------|----------|----------|
| Ingredient | Yes | Ketchup |
| Vendor | Yes* | Ben E. Keith |
| Units per pack | Yes** | 6 |
| Weight per unit | Yes** | 10 |
| Weight unit | Yes** | lb |
| Pack price | Yes | 75.23 |
| Pack size | Alt.** | `6/10#` |
| SKU, Notes | No | |

\*Or set a default vendor in the import form.  
\**Required unless **Pack size** uses shorthand like `6/10#`.

Matching **ingredient + vendor** rows are updated; new pairs are created.

## Recipe text formats

- `Ketchup, 3.4 lb`
- `3.4 lb Ketchup`
- Tab-separated: `Ketchup\t3.4 lb`

## Cost formula

```
total pack weight = unitsPerPack × weightPerUnit (converted to lb)
cost per pound = packPrice ÷ total pack weight
line cost = recipe quantity (in lb) × cost per pound
```

## Tech stack

- Next.js App Router · React 19 · Tailwind CSS 4
- MongoDB Atlas via Mongoose
- OpenAI API for invoice extraction
