import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const control =
  "w-full min-w-0 rounded-lg border border-[var(--color-input)] bg-transparent px-2.5 py-1.5 " +
  "text-sm outline-none transition-colors placeholder:text-[var(--color-muted-foreground)] " +
  "focus-visible:border-[var(--color-ring)] focus-visible:ring-[3px] focus-visible:ring-[var(--color-ring)]/50 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label>
      <span>{label}</span>
      {children}
      {hint ? <small className="micro mt-1 block">{hint}</small> : null}
    </label>
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${control} ${className}`} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${control} min-h-16 ${className}`} />;
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${control} ${className}`} />;
}
