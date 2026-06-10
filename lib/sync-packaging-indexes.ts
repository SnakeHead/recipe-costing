import { CapProduct } from "@/lib/models/CapProduct";
import { ContainerProduct } from "@/lib/models/ContainerProduct";

let synced = false;

/** Applies container and cap schema indexes (once per process). */
export async function syncPackagingIndexes(): Promise<void> {
  if (synced) return;

  await ContainerProduct.syncIndexes();
  await CapProduct.syncIndexes();
  synced = true;
}
