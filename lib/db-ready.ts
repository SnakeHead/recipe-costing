import { connectDB } from "./mongodb";

export function hasDatabaseConfig(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

export async function ensureDb(): Promise<boolean> {
  if (!hasDatabaseConfig()) return false;
  await connectDB();
  return true;
}
