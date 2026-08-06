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
      className="w-full rounded-md bg-brand px-4 py-2.5 text-base font-medium text-txt-inverse transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-txt-hint"
      {...rest}
    >
      {loading ? "Enviando…" : children}
    </button>
  );
}
