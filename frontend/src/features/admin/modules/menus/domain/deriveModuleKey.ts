/**
 * Preview EN VIVO de la `clave` que va a asignar el backend al crear un
 * modulo -- replica el algoritmo de `CreateModuleUseCase._slugify` /
 * `_derive_key` (backend, `apps/administracion/use_cases/navigation/create_module.py`)
 * para que el wizard (`ModuleCreateWizard`) pueda mostrarle al admin "asi
 * va a quedar la clave" ANTES de enviar el POST.
 *
 * IMPORTANTE: esto es solo un preview de UX. La `clave` real la deriva y
 * garantiza unica el SERVIDOR (autoridad de `Modulo.clave.unique=True`) --
 * este helper nunca se manda en el payload de creacion, y si el arbol
 * cambio entre que el admin abrio el wizard y confirmo, el preview puede
 * quedar desactualizado (el backend igual la va a desambiguar sola).
 */

const COMBINING_DIACRITICS = /[̀-ͯ]/g;
const NON_ALNUM_RUN = /[^a-z0-9]+/g;
const EDGE_UNDERSCORES = /^_+|_+$/g;

/**
 * Slug ascii, minusculas, `_` como separador -- mismo alfabeto que ya usan
 * las claves existentes (`administracion.catalogos.tipo_personal`).
 *
 * Espejo exacto de `_slugify` en el backend: normaliza NFKD y descarta
 * diacriticos (acentos), colapsa cualquier corrida de caracteres no
 * alfanumericos en un solo `_`, y recorta `_` sobrantes en los bordes.
 */
export function slugify(value: string | null | undefined): string {
  const ascii = (value ?? "").normalize("NFKD").replace(COMBINING_DIACRITICS, "");
  const lowered = ascii.trim().toLowerCase();
  const collapsed = lowered
    .replace(NON_ALNUM_RUN, "_")
    .replace(EDGE_UNDERSCORES, "");

  return collapsed || "modulo";
}

export interface DeriveModuleKeyParams {
  title: string;
  /** `clave` del padre elegido, o `null`/`undefined` si va a la raiz. */
  parentKey?: string | null;
  /** Claves ya existentes en el arbol (activas + inactivas) -- el mismo
   * universo contra el que el backend prueba colision (`get_by_clave`
   * no filtra por `is_active`). */
  existingKeys: ReadonlySet<string> | readonly string[];
}

/**
 * Deriva la clave candidata y, si colisiona, agrega el sufijo anti-colision
 * `_2`, `_3`, ... -- mismo loop que `CreateModuleUseCase._derive_key`.
 */
export function deriveModuleKey({
  title,
  parentKey,
  existingKeys,
}: DeriveModuleKeyParams): string {
  const known =
    existingKeys instanceof Set ? existingKeys : new Set(existingKeys);

  const baseSlug = slugify(title);
  const baseClave = parentKey ? `${parentKey}.${baseSlug}` : baseSlug;

  let clave = baseClave;
  let suffix = 2;
  while (known.has(clave)) {
    clave = `${baseClave}_${suffix}`;
    suffix += 1;
  }

  return clave;
}
