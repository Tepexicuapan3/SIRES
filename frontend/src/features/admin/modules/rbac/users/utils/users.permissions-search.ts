import type { Permission } from "@api/types";

const SEARCH_SYNONYMS: Record<string, string[]> = {
  actualizar: ["update", "editar", "modificar"],
  update: ["actualizar", "editar", "modificar"],
  crear: ["create", "nuevo", "agregar"],
  create: ["crear", "nuevo", "agregar"],
  leer: ["read", "ver", "consulta"],
  ver: ["read", "leer", "consulta"],
  read: ["leer", "ver", "consulta"],
  eliminar: ["delete", "remove", "borrar"],
  delete: ["eliminar", "quitar", "borrar"],
};

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const normalizeSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const tokenizeSearchText = (value: string) =>
  normalizeSearchText(value)
    .split(/[\s:._-]+/)
    .filter(Boolean);

const isSubsequenceMatch = (needle: string, haystack: string) => {
  if (!needle || !haystack) return false;

  let needleIndex = 0;
  for (
    let haystackIndex = 0;
    haystackIndex < haystack.length;
    haystackIndex += 1
  ) {
    if (needle[needleIndex] === haystack[haystackIndex]) {
      needleIndex += 1;
      if (needleIndex === needle.length) return true;
    }
  }

  return false;
};

export const getPermissionSearchScore = (
  permission: Permission,
  query: string,
) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 1;

  const normalizedCode = normalizeSearchText(permission.code);
  const normalizedDescription = normalizeSearchText(permission.description);
  const queryTokens = tokenizeSearchText(query);
  const codeTokens = tokenizeSearchText(permission.code);
  const descriptionTokens = tokenizeSearchText(permission.description);

  let score = 0;

  if (normalizedCode === normalizedQuery) score += 700;
  if (normalizedDescription === normalizedQuery) score += 650;

  if (normalizedCode.startsWith(normalizedQuery)) score += 420;
  if (normalizedDescription.startsWith(normalizedQuery)) score += 390;

  if (normalizedCode.includes(normalizedQuery)) score += 280;
  if (normalizedDescription.includes(normalizedQuery)) score += 250;

  queryTokens.forEach((token) => {
    const semanticAliases = [token, ...(SEARCH_SYNONYMS[token] ?? [])];
    const hasSemanticMatch = semanticAliases.some(
      (alias) =>
        codeTokens.some((codeToken) => codeToken.startsWith(alias)) ||
        descriptionTokens.some((descriptionToken) =>
          descriptionToken.startsWith(alias),
        ),
    );

    if (hasSemanticMatch) {
      score += 145;
      return;
    }

    const codeTokenMatch = codeTokens.find((codeToken) =>
      codeToken.startsWith(token),
    );
    const descriptionTokenMatch = descriptionTokens.find((descriptionToken) =>
      descriptionToken.startsWith(token),
    );

    if (codeTokenMatch) {
      score += 120;
      return;
    }

    if (descriptionTokenMatch) {
      score += 110;
      return;
    }

    if (normalizedCode.includes(token)) {
      score += 70;
      return;
    }

    if (normalizedDescription.includes(token)) {
      score += 65;
      return;
    }

    score -= 45;
  });

  if (isSubsequenceMatch(normalizedQuery, normalizedCode)) score += 80;
  if (isSubsequenceMatch(normalizedQuery, normalizedDescription)) score += 70;

  return score;
};

export const parseDateValue = (value: string | null | undefined) => {
  if (!value) return null;

  const dateOnlyMatch = DATE_ONLY_PATTERN.exec(value);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export const toLocalDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatLocalDisplayDate = (date: Date) =>
  new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(date);
