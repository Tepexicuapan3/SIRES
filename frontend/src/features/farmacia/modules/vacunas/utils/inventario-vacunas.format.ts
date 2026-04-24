export function formatDoses(count: number): string {
  return count === 1 ? "1 dosis" : `${count} dosis`;
}

export function formatStock(count: number): string {
  return count === 1 ? "1 unidad" : `${count} unidades`;
}

export function getAvailabilityLabel(available: number, total: number): string {
  if (total === 0) return "Sin existencia";
  const pct = Math.round((available / total) * 100);
  if (pct === 0) return "Agotado";
  if (pct <= 20) return "Stock crítico";
  if (pct <= 50) return "Stock bajo";
  return "Disponible";
}
