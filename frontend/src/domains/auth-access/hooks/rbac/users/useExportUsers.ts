import { useState } from "react";
import { usersAPI } from "@api/resources/users.api";
import type { UsersListParams } from "@api/types";

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const useExportUsers = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportUsers = async (params?: UsersListParams) => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const blob = await usersAPI.export(params);
      const date = new Date().toISOString().slice(0, 10);
      triggerDownload(blob, `usuarios_${date}.xlsx`);
    } finally {
      setIsExporting(false);
    }
  };

  return { exportUsers, isExporting };
};
