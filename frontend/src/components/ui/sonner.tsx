import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  // Aquí es donde ocurre la magia de shadcn:
  // Inyectamos clases de Tailwind en las propiedades 'toastOptions'
  return (
    <Sonner
      theme="system"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-paper group-[.toaster]:text-txt-body group-[.toaster]:border-line-struct group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl border",
          description: "group-[.toast]:text-txt-muted",
          actionButton:
            "group-[.toast]:bg-brand group-[.toast]:text-white group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-paper-hover group-[.toast]:text-txt-body",
          error: "group-[.toaster]:text-status-critical",
          success: "group-[.toaster]:text-status-success",
          warning: "group-[.toaster]:text-status-warning",
          info: "group-[.toaster]:text-brand",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
