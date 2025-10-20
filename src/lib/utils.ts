export function parseJSON(text: string): { ok: true; value: any } | { ok: false; error: any } {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch (error) {
    return { ok: false, error }
  }
}
