export function getCatalogErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") return fallback;
  const err = error as Record<string, unknown>;
  if (typeof err["message"] === "string") return err["message"];
  const response = err["response"] as Record<string, unknown> | undefined;
  const data = response?.["data"] as Record<string, unknown> | undefined;
  if (typeof data?.["detail"] === "string") return data["detail"];
  if (typeof data?.["non_field_errors"] === "string") return data["non_field_errors"];
  return fallback;
}
