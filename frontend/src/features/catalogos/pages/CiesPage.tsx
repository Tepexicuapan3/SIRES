import { useRef, useState } from "react";
import { ciesAPI, CiesPreviewResponse, CiesUploadRow } from "@/api/resources/catalogos/cies.api";
import {
  CiesUploadForm,
  CiesUploadFormRef,
} from "@/features/admin/modules/catalogos/cies/components/CiesUploadForm";

/* ─────────────────────────────────────────────
   AlertBanner
───────────────────────────────────────────── */
function AlertBanner({ result, confirmed }: { result: CiesPreviewResponse; confirmed: boolean }) {
  const { total_records, total_errores } = result;
  const validos = total_records - total_errores;

  if (confirmed) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
        <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>
          <strong>¡Listo!</strong>{" "}
          {validos === 1 ? "Se importó 1 registro" : `Se importaron ${validos} registros`} al
          Catálogo de Enfermedades correctamente.
          {total_errores > 0 && (
            <> {total_errores === 1 ? "1 registro fue omitido" : `${total_errores} registros fueron omitidos`} por errores.</>
          )}
        </p>
      </div>
    );
  }

  if (total_errores === total_records) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
        <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <p>
          <strong>No es posible continuar.</strong> Todos los registros contienen errores.
          Corrígelos en el Excel y vuelve a intentarlo.
        </p>
      </div>
    );
  }

  if (total_errores === 0) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
        <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>
          Si continúas se {total_records === 1 ? "importará" : "importarán"}{" "}
          <strong>{total_records} {total_records === 1 ? "registro" : "registros"}</strong> al
          Catálogo de Enfermedades.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-5 py-4 text-sm text-orange-800">
      <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <p>
        Se {total_errores === 1 ? "detectó" : "detectaron"}{" "}
        <strong>{total_errores} {total_errores === 1 ? "error" : "errores"}</strong>.{" "}
        Si continúas se {validos === 1 ? "importará" : "importarán"}{" "}
        <strong>{validos} {validos === 1 ? "registro válido" : "registros válidos"}</strong>.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Chips de resumen
───────────────────────────────────────────── */
function Chip({ label, value, color }: { label: string; value: number; color: "slate" | "red" | "emerald" }) {
  const styles = {
    slate:   "bg-slate-100 text-slate-700 border-slate-200",
    red:     "bg-red-100 text-red-700 border-red-200",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  return (
    <div className={`flex items-center gap-2 border rounded-xl px-4 py-2 text-sm font-medium ${styles[color]}`}>
      <span className="text-xs opacity-70">{label}</span>
      <span className="text-base font-bold">{value}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Tabla paginada
───────────────────────────────────────────── */
const ROWS_PER_PAGE = 10;

function PreviewTable({ rows }: { rows: CiesUploadRow[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(rows.length / ROWS_PER_PAGE);
  const start = (page - 1) * ROWS_PER_PAGE;
  const pageRows = rows.slice(start, start + ROWS_PER_PAGE);
  const goTo = (p: number) => setPage(Math.max(1, Math.min(totalPages, p)));

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-slate-800 text-slate-100 uppercase tracking-wide text-[11px]">
              <th className="px-4 py-3 font-semibold text-center w-24">Clave</th>
              <th className="px-4 py-3 font-semibold">Descripción de Enfermedad</th>
              <th className="px-4 py-3 font-semibold text-center w-28">Versión CIE</th>
              <th className="px-4 py-3 font-semibold text-center w-56">Tipo de Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRows.map((row, i) => {
              const hasError = row.ERROR.trim() !== "";
              return (
                <tr key={start + i} className={hasError ? "bg-red-50 hover:bg-red-100" : "bg-white hover:bg-slate-50"}>
                  <td className={`px-4 py-2.5 text-center font-mono font-semibold ${hasError ? "text-red-700" : "text-slate-700"}`}>
                    {row.CLAVE}
                  </td>
                  <td className={`px-4 py-2.5 ${hasError ? "text-red-800" : "text-slate-700"}`}>
                    {row.DESCRIPCION}
                  </td>
                  <td className={`px-4 py-2.5 text-center ${hasError ? "text-red-600" : "text-slate-500"}`}>
                    {row.VERSION}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {hasError ? (
                      <span className="inline-flex items-center gap-1 text-red-700 font-medium">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {row.ERROR.trim()}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Sin errores
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer: conteo + paginación */}
      <div className="flex items-center justify-between mt-3 px-1">
        <p className="text-xs text-slate-500">
          Mostrando {start + 1}–{Math.min(start + ROWS_PER_PAGE, rows.length)} de{" "}
          <strong>{rows.length}</strong> registros
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <PagBtn onClick={() => goTo(1)} disabled={page === 1} label="«" />
            <PagBtn onClick={() => goTo(page - 1)} disabled={page === 1} label="‹" />
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`e-${i}`} className="px-2 text-slate-400 text-xs">…</span>
                ) : (
                  <PagBtn key={p} onClick={() => goTo(p as number)} label={String(p)} active={page === p} />
                )
              )}
            <PagBtn onClick={() => goTo(page + 1)} disabled={page === totalPages} label="›" />
            <PagBtn onClick={() => goTo(totalPages)} disabled={page === totalPages} label="»" />
          </div>
        )}
      </div>
    </div>
  );
}

function PagBtn({ onClick, disabled = false, label, active = false }: {
  onClick: () => void; disabled?: boolean; label: string; active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium transition-colors
        ${active ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}
        disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {label}
    </button>
  );
}

/* ─────────────────────────────────────────────
   CiesPage
───────────────────────────────────────────── */
const CiesPage = () => {
  const uploadRef = useRef<CiesUploadFormRef>(null);
  const [result, setResult] = useState<CiesPreviewResponse | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handlePreview = async () => {
    setLoadingPreview(true);
    setResult(null);
    setConfirmed(false);
    try {
      const res = await uploadRef.current?.preview();
      if (res) setResult(res);
    } catch {
      alert("Error al procesar el archivo");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConfirm = async () => {
    if (!result) return;
    setLoadingConfirm(true);
    try {
      await ciesAPI.confirm(result.rows);
      setConfirmed(true);
    } catch {
      alert("Error al importar los registros");
    } finally {
      setLoadingConfirm(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setConfirmed(false);
  };

  const canImport = result !== null && !confirmed && result.total_errores < result.total_records;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-7">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Versión CIE</h1>
              <p className="text-sm text-slate-500 mt-1">
                Importación masiva de claves al Catálogo de Enfermedades
              </p>
            </div>
            {(result || confirmed) && (
              <button
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Limpiar
              </button>
            )}
          </div>

          <CiesUploadForm ref={uploadRef} />

          {/* Botones */}
          <div className="flex flex-wrap gap-3 mt-5">
            {!confirmed && (
              <button
                onClick={handlePreview}
                disabled={loadingPreview}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
              >
                {loadingPreview ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Pre-visualizar información
                  </>
                )}
              </button>
            )}

            {canImport && (
              <button
                onClick={handleConfirm}
                disabled={loadingConfirm}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
              >
                {loadingConfirm ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Importando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Importar al Catálogo de Enfermedades
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Resultados */}
        {result && (
          <div className="space-y-4" style={{ animation: "fadeIn 0.3s ease forwards" }}>
            <AlertBanner result={result} confirmed={confirmed} />

            <div className="flex flex-wrap gap-3">
              <Chip label="Total registros" value={result.total_records} color="slate" />
              <Chip label="Con errores" value={result.total_errores} color={result.total_errores > 0 ? "red" : "slate"} />
              <Chip label="Válidos" value={result.total_records - result.total_errores} color={result.total_records - result.total_errores > 0 ? "emerald" : "slate"} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18M3 18h18" />
                  </svg>
                  Vista previa del archivo
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-red-200 inline-block" /> Fila con error
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-white border border-slate-200 inline-block" /> Sin error
                  </span>
                </div>
              </div>
              <PreviewTable rows={result.rows} />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default CiesPage;