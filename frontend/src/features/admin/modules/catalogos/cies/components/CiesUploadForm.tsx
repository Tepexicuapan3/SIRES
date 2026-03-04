import { useState, forwardRef, useImperativeHandle } from "react";
import { ciesAPI, CiesPreviewResponse } from "@/api/resources/catalogos/cies.api";

export type CiesUploadFormRef = {
  preview: () => Promise<CiesPreviewResponse | null>;
};

export const CiesUploadForm = forwardRef<CiesUploadFormRef>((_, ref) => {
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState("CIE-10");

  const preview = async (): Promise<CiesPreviewResponse | null> => {
    if (!file) {
      alert("Selecciona un archivo primero");
      return null;
    }
    try {
      return await ciesAPI.preview(file, version);
    } catch {
      alert("Error al cargar el archivo");
      return null;
    }
  };

  useImperativeHandle(ref, () => ({ preview }));

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* File picker */}
      <label className="flex-1 flex items-center gap-2 cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl px-4 py-3 transition-colors bg-slate-50 hover:bg-blue-50 group">
        <svg
          className="w-5 h-5 text-slate-400 group-hover:text-blue-500 shrink-0"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-sm text-slate-500 group-hover:text-blue-600 truncate">
          {file ? file.name : "Seleccionar archivo .xlsx"}
        </span>
        <input
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>

      {/* Versión */}
      <input
        type="text"
        value={version}
        onChange={(e) => setVersion(e.target.value)}
        placeholder="Versión CIE"
        className="sm:w-36 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    </div>
  );
});

CiesUploadForm.displayName = "CiesUploadForm";