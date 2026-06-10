import { PackagingTabs } from "@/components/PackagingTabs";
import { PageHeader } from "@/components/ui";

export default function PackagingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <PageHeader
        title="Packaging"
        description="Track bottle and cap pricing across vendors to find the best deal."
      />
      <PackagingTabs />
      {children}
    </div>
  );
}
