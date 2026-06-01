import { Card } from "@/components/ui";

export function SetupRequired() {
  return (
    <Card>
      <h2 className="font-semibold">Database not configured</h2>
      <p className="mt-2 text-sm text-stone-600">
        Copy <code className="rounded bg-stone-100 px-1">.env.example</code> to{" "}
        <code className="rounded bg-stone-100 px-1">.env.local</code> and set your
        MongoDB Atlas connection string and OpenAI API key.
      </p>
      <pre className="mt-4 overflow-x-auto rounded-lg bg-stone-900 p-4 text-xs text-stone-100">
        {`MONGODB_URI=mongodb+srv://...
OPENAI_API_KEY=sk-...`}
      </pre>
    </Card>
  );
}
