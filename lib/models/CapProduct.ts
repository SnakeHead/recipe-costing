import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const capMaterialTypes = ["metal", "plastic"] as const;

const capProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    vendor: { type: String, required: true, trim: true },
    fitsContainerName: { type: String, required: true, trim: true },
    fitsContainerSize: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    materialType: {
      type: String,
      enum: capMaterialTypes,
      required: true,
    },
    priceEach: { type: Number, required: true, min: 0 },
    minOrderQty: { type: Number, required: true, min: 1, default: 1 },
    sku: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

capProductSchema.index(
  { vendor: 1, sku: 1 },
  {
    unique: true,
    partialFilterExpression: { sku: { $gt: "" } },
  },
);
capProductSchema.index(
  {
    name: 1,
    vendor: 1,
    fitsContainerName: 1,
    fitsContainerSize: 1,
    color: 1,
    materialType: 1,
  },
  {
    unique: true,
    partialFilterExpression: { sku: { $eq: "" } },
  },
);

export type CapMaterialType = (typeof capMaterialTypes)[number];

export type CapProductDocument = InferSchemaType<typeof capProductSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const CapProduct: Model<CapProductDocument> =
  mongoose.models.CapProduct ??
  mongoose.model<CapProductDocument>("CapProduct", capProductSchema);
