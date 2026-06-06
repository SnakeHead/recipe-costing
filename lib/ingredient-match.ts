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

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () =>
    Array<number>(cols).fill(0),
  );

  for (let i = 0; i < rows; i++) matrix[i][0] = i;
  for (let j = 0; j < cols; j++) matrix[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

function tokensEquivalent(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  const maxLen = Math.max(a.length, b.length);
  if (maxLen < 4) return false;

  const distance = levenshtein(a, b);
  const threshold = Math.max(2, Math.floor(Math.min(a.length, b.length) * 0.25));
  return distance <= threshold;
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
    if (productSet.has(token)) {
      overlap++;
      continue;
    }
    for (const productToken of productSet) {
      if (tokensEquivalent(token, productToken)) {
        overlap++;
        break;
      }
    }
  }

  // Multi-word recipe names must match every token (e.g. "black pepper"
  // should not match "pepper bell green diced").
  if (recipeSet.size > 1 && overlap < recipeSet.size) {
    const missingRatio = (recipeSet.size - overlap) / recipeSet.size;
    return Math.max(0, overlap / recipeSet.size - missingRatio * 0.5) * 0.35;
  }

  const union = new Set([...recipeSet, ...productSet]).size;
  const jaccard = overlap / union;
  const coverage = overlap / recipeSet.size;

  return Math.max(jaccard, coverage * 0.9);
}

export const MIN_MATCH_SCORE = 0.45;

export interface RankedIngredientMatch<T> {
  item: T;
  score: number;
}

/** Rank inventory items by similarity to a recipe ingredient name. */
export function rankIngredientMatches<T extends { name: string }>(
  recipeName: string,
  items: T[],
  limit = 12,
): RankedIngredientMatch<T>[] {
  return items
    .map((item) => ({
      item,
      score: scoreIngredientSimilarity(recipeName, item.name),
    }))
    .filter((entry) => entry.score >= MIN_MATCH_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
