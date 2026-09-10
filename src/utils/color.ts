/** Replace alpha channel of an rgb/rgba CSS color string. */
export function withAlpha(color: string, alpha: number): string {
  const m = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+)?\s*\)/i)
  if (!m) return color
  const a = Math.min(1, Math.max(0, alpha))
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${a})`
}
