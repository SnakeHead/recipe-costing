"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input } from "@/components/ui";

export function ClientForm({
  initial,
  clientId,
}: {
  initial?: {
    name: string;
    companyName: string;
    phone: string;
    email: string;
  };
  clientId?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [companyName, setCompanyName] = useState(initial?.companyName ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = clientId ? `/api/clients/${clientId}` : "/api/clients";
    const method = clientId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, companyName, phone, email }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to save client");
      return;
    }

    router.push(`/clients/${data._id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg">
      <Field label="Contact name *">
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Company name">
        <Input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
      </Field>
      <Field label="Phone">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      <Field label="Email">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : clientId ? "Update client" : "Create client"}
      </Button>
    </form>
  );
}
