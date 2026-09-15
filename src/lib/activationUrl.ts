// Se arma con el origin actual del browser, así funciona igual en
// localhost que en producción sin depender de una env var expuesta al
// cliente.
export function buildActivationUrl(code: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/activar?code=${encodeURIComponent(code)}`;
}
