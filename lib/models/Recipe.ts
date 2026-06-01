import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const recipeLineSchema = new Schema(
  {
    ingredientName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
    ingredientProductId: {
      type: Schema.Types.ObjectId,
      ref: "IngredientProduct",
    },
    vendor: { type: String, trim: true },
    costPerPound: { type: Number },
    lineCost: { type: Number },
    matchNote: { type: String, trim: true },
  },
  { _id: false },
);

const recipeSchema = new Schema(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    rawText: { type: String, default: "" },
    lines: { type: [recipeLineSchema], default: [] },
    totalCost: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type RecipeDocument = InferSchemaType<typeof recipeSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Recipe: Model<RecipeDocument> =
  mongoose.models.Recipe ?? mongoose.model<RecipeDocument>("Recipe", recipeSchema);
