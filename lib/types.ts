export type WeightUnit = "lb" | "oz" | "kg" | "g";

export type CapMaterialType = "metal" | "plastic";

export type ContainerCaseSize = "6pk" | "12pk" | "bulk";

export type ContainerMaterialType = "glass" | "plastic";

export interface RecipeLineInput {
  ingredientName: string;
  quantity: number;
  unit: string;
  ingredientProductId?: string;
}

export interface ParsedRecipeLine {
  ingredientName: string;
  quantity: number;
  unit: string;
  ingredientProductId?: string;
}

export interface IngredientMatchCandidate {
  ingredientProductId: string;
  name: string;
  vendor: string;
  brand: string;
  score: number;
  packPrice?: number;
  costPerPound?: number;
  estimatedLineCost?: number;
}

export interface CostedRecipeLine extends ParsedRecipeLine {
  ingredientProductId?: string;
  vendor?: string;
  brand?: string;
  costPerPound?: number;
  lineCost?: number;
  matchNote?: string;
  matchCandidates?: IngredientMatchCandidate[];
  needsSelection?: boolean;
}

export interface ExtractedInvoiceLine {
  productName: string;
  vendor?: string;
  brand?: string;
  unitsPerPack?: number;
  unitSize?: string;
  weightUnit?: WeightUnit;
  packPrice?: number;
  quantityOrdered?: number;
  lineTotal?: number;
}
