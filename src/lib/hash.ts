/**
 * Fast, stable string fingerprint for cache keys.
 *
 * Not cryptographic — it only needs to be cheap and collision-resistant enough
 * for cache keys, and must NOT be used for anything security-sensitive.
 */
export function fingerprint(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}
