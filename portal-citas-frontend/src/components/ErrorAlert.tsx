export default function ErrorAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-md border border-status-critical/30 bg-status-critical/10 px-3 py-2 text-sm text-status-critical"
    >
      {message}
    </div>
  );
}
