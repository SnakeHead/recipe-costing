"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";

export function DeleteRecipeButton({
  recipeId,
  recipeName,
  clientId,
}: {
  recipeId: string;
  recipeName: string;
  clientId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${recipeName}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    setLoading(true);
    setError("");

    const res = await fetch(`/api/recipes/${recipeId}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to delete recipe");
      return;
    }

    router.push(`/clients/${clientId}`);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="danger"
        onClick={handleDelete}
        disabled={loading}
      >
        {loading ? "Deleting…" : "Delete recipe"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
