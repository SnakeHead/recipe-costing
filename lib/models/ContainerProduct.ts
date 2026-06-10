import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const containerProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    vendor: { type: String, required: true, trim: true },
    size: { type: String, required: true, trim: true },
    priceEach: { type: Number, required: true, min: 0 },
    minOrderQty: { type: Number, required: true, min: 1, default: 1 },
    sku: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

containerProductSchema.index(
  { vendor: 1, sku: 1 },
  {
    unique: true,
    partialFilterExpression: { sku: { $gt: "" } },
  },
);
containerProductSchema.index(
  { name: 1, vendor: 1, size: 1 },
  {
    unique: true,
    partialFilterExpression: { sku: { $eq: "" } },
  },
);

export type ContainerProductDocument = InferSchemaType<
  typeof containerProductSchema
> & { _id: mongoose.Types.ObjectId };

export const ContainerProduct: Model<ContainerProductDocument> =
  mongoose.models.ContainerProduct ??
  mongoose.model<ContainerProductDocument>(
    "ContainerProduct",
    containerProductSchema,
  );
