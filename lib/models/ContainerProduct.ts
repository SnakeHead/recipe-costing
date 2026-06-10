import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { calculateContainerPriceEach } from "@/lib/container-pricing";

const containerProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    vendor: { type: String, required: true, trim: true },
    size: { type: String, required: true, trim: true },
    materialType: {
      type: String,
      enum: ["glass", "plastic"],
      default: "glass",
    },
    caseSize: {
      type: String,
      enum: ["6pk", "12pk", "bulk"],
      default: "bulk",
    },
    casePrice: { type: Number, required: true, min: 0 },
    unitsPerCase: { type: Number, required: true, min: 1 },
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
  { name: 1, vendor: 1, size: 1, materialType: 1, caseSize: 1 },
  {
    unique: true,
    partialFilterExpression: { sku: { $eq: "" } },
  },
);

containerProductSchema.pre("save", function () {
  const cost = calculateContainerPriceEach(this.casePrice, this.unitsPerCase);
  if (cost !== null) this.priceEach = cost;
});

export type ContainerProductDocument = InferSchemaType<
  typeof containerProductSchema
> & { _id: mongoose.Types.ObjectId };

export const ContainerProduct: Model<ContainerProductDocument> =
  mongoose.models.ContainerProduct ??
  mongoose.model<ContainerProductDocument>(
    "ContainerProduct",
    containerProductSchema,
  );
