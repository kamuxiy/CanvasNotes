export function screenToWorld(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  viewport: { x: number; y: number; zoom: number },
) {
  return {
    x: (clientX - rect.left - viewport.x) / viewport.zoom,
    y: (clientY - rect.top - viewport.y) / viewport.zoom,
  }
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/** ComfyUI-style cubic bezier between socket centers */
export function bezierPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): string {
  const dx = Math.abs(x2 - x1)
  const curvature = Math.max(48, dx * 0.55)
  const cx1 = x1 + curvature
  const cx2 = x2 - curvature
  return `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`
}

export function manhattanPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): string {
  const midX = x1 + (x2 - x1) / 2
  return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`
}
