export type WeightUnit = "lb" | "oz" | "kg" | "g";

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
}

export interface CostedRecipeLine extends ParsedRecipeLine {
  ingredientProductId?: string;
  vendor?: string;
  costPerPound?: number;
  lineCost?: number;
  matchNote?: string;
}

export interface ExtractedInvoiceLine {
  productName: string;
  vendor?: string;
  unitsPerPack?: number;
  weightPerUnit?: number;
  weightUnit?: WeightUnit;
  packPrice?: number;
  quantityOrdered?: number;
  lineTotal?: number;
}
