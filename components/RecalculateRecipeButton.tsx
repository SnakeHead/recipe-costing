"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";

export function RecalculateRecipeButton({ recipeId }: { recipeId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function recalculate() {
    setLoading(true);
    await fetch(`/api/recipes/${recipeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recalculate: true }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button type="button" variant="secondary" onClick={recalculate} disabled={loading}>
      {loading ? "Updating…" : "Recalculate costs"}
    </Button>
  );
}
