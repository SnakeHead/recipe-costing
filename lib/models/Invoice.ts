import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const extractedLineSchema = new Schema(
  {
    productName: { type: String, required: true, trim: true },
    vendor: { type: String, trim: true },
    unitsPerPack: { type: Number },
    weightPerUnit: { type: Number },
    weightUnit: { type: String, enum: ["lb", "oz", "kg", "g"] },
    packPrice: { type: Number },
    quantityOrdered: { type: Number },
    lineTotal: { type: Number },
    applied: { type: Boolean, default: false },
  },
  { _id: false },
);

const invoiceSchema = new Schema(
  {
    vendor: { type: String, trim: true, default: "" },
    fileName: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "pending",
    },
    extractedLines: { type: [extractedLineSchema], default: [] },
    errorMessage: { type: String, trim: true },
  },
  { timestamps: true },
);

export type InvoiceDocument = InferSchemaType<typeof invoiceSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Invoice: Model<InvoiceDocument> =
  mongoose.models.Invoice ??
  mongoose.model<InvoiceDocument>("Invoice", invoiceSchema);
