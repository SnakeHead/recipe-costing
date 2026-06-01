import type { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-stone-200 bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">{title}</h1>
        {description && (
          <p className="mt-1 text-stone-600">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  const variants = {
    primary:
      "bg-emerald-700 text-white hover:bg-emerald-800 disabled:bg-emerald-400",
    secondary:
      "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 ${className}`}
      {...props}
    />
  );
}

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 ${className}`}
      {...props}
    />
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-sm font-medium text-stone-700">
      {children}
    </label>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
