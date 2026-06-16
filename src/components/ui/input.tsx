import * as React from "react";

import { cn } from "@/lib/utils";

const fieldBase =
  "w-full min-w-0 rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground shadow-sm transition-[color,box-shadow] outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/30";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input type={type} className={cn(fieldBase, className)} {...props} />
  );
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, className)} {...props} />;
}

export interface FieldProps {
  label?: string;
  hint?: string;
  htmlFor?: string;
  /** When provided, renders as a destructive error message below the input. */
  error?: string;
  className?: string;
  children: React.ReactNode;
}

function Field({
  label,
  hint,
  htmlFor,
  error,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export { Input, Textarea, Field };
