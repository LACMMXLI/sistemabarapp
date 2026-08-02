interface Bucket {
  count: number;
  windowStartedAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Limitador de ventana fija en memoria de proceso. Suficiente para una sola
 * instancia del backend en el alcance inicial (un solo negocio, un servidor).
 */
export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStartedAt > windowMs) {
    buckets.set(key, { count: 1, windowStartedAt: now });
    return true;
  }
  if (bucket.count >= maxAttempts) {
    return false;
  }
  bucket.count += 1;
  return true;
}

export function getClientIp(req: { headers: Record<string, unknown>; ip?: string }): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.ip ?? "unknown";
}
