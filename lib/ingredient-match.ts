const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "the",
  "of",
  "per",
  "with",
]);

/** Normalize an ingredient name into comparable tokens. */
export function tokenizeIngredientName(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[#/]/g, " ")
    .replace(/(\d+)\s*\/\s*(\d+)/g, "$1-$2")
    .replace(/[^\w\s-]/g, " ")
    .split(/[\s-]+/)
    .map(singularizeToken)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function singularizeToken(word: string): string {
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith("es") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("s") && word.length > 3) return word.slice(0, -1);
  return word;
}

/** Score how well two ingredient names refer to the same product (0–1). */
export function scoreIngredientSimilarity(
  recipeName: string,
  productName: string,
): number {
  const recipe = recipeName.trim().toLowerCase();
  const product = productName.trim().toLowerCase();

  if (!recipe || !product) return 0;
  if (recipe === product) return 1;

  if (product.includes(recipe) || recipe.includes(product)) {
    const ratio =
      Math.min(recipe.length, product.length) /
      Math.max(recipe.length, product.length);
    return 0.85 + ratio * 0.1;
  }

  const recipeTokens = tokenizeIngredientName(recipe);
  const productTokens = tokenizeIngredientName(product);
  if (recipeTokens.length === 0 || productTokens.length === 0) return 0;

  const recipeSet = new Set(recipeTokens);
  const productSet = new Set(productTokens);

  let overlap = 0;
  for (const token of recipeSet) {
    if (productSet.has(token)) overlap++;
  }

  const union = new Set([...recipeSet, ...productSet]).size;
  const jaccard = overlap / union;
  const coverage = overlap / recipeSet.size;

  return Math.max(jaccard, coverage * 0.9);
}

export const MIN_MATCH_SCORE = 0.45;
