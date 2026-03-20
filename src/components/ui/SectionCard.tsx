import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  children: ReactNode;
  headerAction?: ReactNode;
}

export default function SectionCard({ title, children, headerAction }: SectionCardProps) {
  return (
    <section className="rounded-2xl bg-zinc-900/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        {headerAction}
      </div>
      {children}
    </section>
  );
}
