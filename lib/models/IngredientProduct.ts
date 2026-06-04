import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { calculateCostPerPound } from "@/lib/costing";
import type { WeightUnit } from "@/lib/types";

const ingredientProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    vendor: { type: String, required: true, trim: true },
    brand: { type: String, trim: true, default: "" },
    unitsPerPack: { type: Number, required: true, min: 0.001 },
    unitSize: { type: String, required: true, trim: true },
    weightUnit: {
      type: String,
      enum: ["lb", "oz", "kg", "g"],
      default: "lb",
    },
    packPrice: { type: Number, required: true, min: 0 },
    costPerPound: { type: Number },
    sku: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

ingredientProductSchema.index({ name: 1, vendor: 1, brand: 1 }, { unique: true });

ingredientProductSchema.pre("save", function () {
  const cost = calculateCostPerPound(
    this.packPrice,
    this.unitsPerPack,
    this.unitSize,
    this.weightUnit as WeightUnit,
  );
  if (cost !== null) this.costPerPound = cost;
});

export type IngredientProductDocument = InferSchemaType<
  typeof ingredientProductSchema
> & { _id: mongoose.Types.ObjectId };

export const IngredientProduct: Model<IngredientProductDocument> =
  mongoose.models.IngredientProduct ??
  mongoose.model<IngredientProductDocument>(
    "IngredientProduct",
    ingredientProductSchema,
  );
