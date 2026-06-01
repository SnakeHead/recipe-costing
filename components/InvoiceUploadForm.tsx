"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Textarea } from "@/components/ui";

export function InvoiceUploadForm() {
  const router = useRouter();
  const [vendor, setVendor] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file && !text.trim()) {
      setError("Upload a file or paste invoice text");
      return;
    }

    setLoading(true);
    setError("");

    const form = new FormData();
    if (vendor) form.append("vendor", vendor);
    if (file) form.append("file", file);
    if (text.trim()) form.append("text", text.trim());

    const res = await fetch("/api/invoices/upload", {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Upload failed");
      return;
    }

    router.push(`/invoices/${data._id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <Field label="Vendor (optional if on invoice)">
        <Input
          placeholder="Ben E. Keith"
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
        />
      </Field>
      <Field label="Upload invoice (PDF, image, or .txt)">
        <Input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,image/*,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </Field>
      <Field label="Or paste invoice text">
        <Textarea
          rows={8}
          placeholder="Paste line items from your distributor invoice…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </Field>
      <p className="text-xs text-stone-500">
        Requires OPENAI_API_KEY. AI extracts pack sizes, weights, and prices to
        update your ingredient database.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Extracting…" : "Scan invoice"}
      </Button>
    </form>
  );
}
