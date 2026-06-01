import { ClientForm } from "@/components/ClientForm";
import { Card, PageHeader } from "@/components/ui";

export default function NewClientPage() {
  return (
    <div>
      <PageHeader title="New client" />
      <Card>
        <ClientForm />
      </Card>
    </div>
  );
}
