export interface HttpJsonResponse<TBody = unknown> {
  status: number;
  body: TBody | null;
}

export const safeJsonParse = async <TBody = unknown>(
  jsonReader: () => Promise<unknown>,
): Promise<TBody | null> => {
  try {
    return (await jsonReader()) as TBody;
  } catch {
    return null;
  }
};
