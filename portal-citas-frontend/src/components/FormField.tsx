import type { InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

/** Input simple con label, reutilizado en los 3 pasos del login. */
export default function FormField({ label, id, ...inputProps }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1 text-left">
      <label htmlFor={id} className="text-sm font-medium text-txt-body">
        {label}
      </label>
      <input
        id={id}
        name={id}
        className="rounded-md border border-line-struct px-3 py-2 text-base focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        {...inputProps}
      />
    </div>
  );
}
