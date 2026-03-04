type SafeLoaderMetadata = Record<string, unknown>;

export async function safeLoader<T>(
  label: string,
  loader: () => Promise<T>,
  fallback: T,
  metadata?: SafeLoaderMetadata,
): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    if (metadata) {
      console.error(`[${label}]`, { error, metadata });
    } else {
      console.error(`[${label}]`, error);
    }
    return fallback;
  }
}
