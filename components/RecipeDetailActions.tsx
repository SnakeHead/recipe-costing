"use client";

import Link from "next/link";
import { RecalculateRecipeButton } from "@/components/RecalculateRecipeButton";
import { DeleteRecipeButton } from "@/components/DeleteRecipeButton";
import { Button } from "@/components/ui";

export function RecipeDetailActions({
  recipeId,
  recipeName,
  clientId,
}: {
  recipeId: string;
  recipeName: string;
  clientId: string;
}) {
  return (
    <div className="flex flex-wrap items-start gap-2">
      <Link href={`/recipes/${recipeId}/edit`}>
        <Button type="button" variant="secondary">
          Edit recipe
        </Button>
      </Link>
      <RecalculateRecipeButton recipeId={recipeId} />
      <DeleteRecipeButton
        recipeId={recipeId}
        recipeName={recipeName}
        clientId={clientId}
      />
    </div>
  );
}
