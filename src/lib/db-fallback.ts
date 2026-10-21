/** Keep public pages responsive when the remote database is slow or offline. */
export async function withDbFallback<T>(
  request: Promise<T>,
  fallback: T,
  label: string,
  timeoutMs = 500,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      request,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} request timed out`)), timeoutMs);
      }),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    console.warn(`${label} unavailable; showing fallback content: ${message}`);
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
