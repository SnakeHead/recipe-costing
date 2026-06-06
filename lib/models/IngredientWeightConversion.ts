import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const conversionSchema = new Schema(
  {
    ingredientName: { type: String, required: true, trim: true },
    measureQuantity: { type: Number, required: true, min: 0 },
    measureUnit: { type: String, required: true, trim: true },
    pounds: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

conversionSchema.index(
  { ingredientName: 1, measureQuantity: 1, measureUnit: 1 },
  { unique: true },
);

export type IngredientWeightConversionDocument = InferSchemaType<
  typeof conversionSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const IngredientWeightConversion: Model<IngredientWeightConversionDocument> =
  mongoose.models.IngredientWeightConversion ??
  mongoose.model<IngredientWeightConversionDocument>(
    "IngredientWeightConversion",
    conversionSchema,
  );
