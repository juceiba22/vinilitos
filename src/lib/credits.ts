export interface Credit {
  role: string;
  names: string;
}

// Page.credits es un campo Json: lo normalizamos a una lista prolija sin
// confiar en su forma.
export function parseCredits(value: unknown): Credit[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((c) => ({
      role: typeof c?.role === "string" ? c.role : "",
      names: typeof c?.names === "string" ? c.names : "",
    }))
    .filter((c) => c.role || c.names);
}
