import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const clientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
  },
  { timestamps: true },
);

export type ClientDocument = InferSchemaType<typeof clientSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Client: Model<ClientDocument> =
  mongoose.models.Client ??
  mongoose.model<ClientDocument>("Client", clientSchema);
