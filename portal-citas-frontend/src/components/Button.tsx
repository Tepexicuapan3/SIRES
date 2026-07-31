import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export default function Button({
  loading,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className="w-full rounded-md bg-slate-800 px-4 py-2.5 text-base font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      {...rest}
    >
      {loading ? "Enviando…" : children}
    </button>
  );
}
