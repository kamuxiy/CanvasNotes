import type { PointerEvent as ReactPointerEvent } from 'react'
import type { CanvasNode, GroupData } from '../types'
import { withAlpha } from '../utils/color'

type Props = {
  node: CanvasNode
  selected: boolean
  showHandles: boolean
  zoom: number
  onSelect: (id: string, additive: boolean) => void
  onMove: (id: string, x: number, y: number, memberIds: string[]) => void
  onResize: (id: string, x: number, y: number, width: number, height: number) => void
  getMemberIds: (groupId: string) => string[]
  onRequestHandles: (id: string) => void
}

type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export function GroupFrame({
  node,
  selected,
  showHandles,
  zoom,
  onSelect,
  onMove,
  onResize,
  getMemberIds,
  onRequestHandles,
}: Props) {
  const data = node.data as GroupData
  const bodyColor = withAlpha(data.color, 0.1)
  const titlebarColor = withAlpha(data.color, 0.55)

  const beginMove = (e: ReactPointerEvent) => {
    if (e.button !== 0) return
    e.stopPropagation()
    onSelect(node.id, e.shiftKey)
    onRequestHandles(node.id)
    const lockedMembers = getMemberIds(node.id)
    const startX = e.clientX
    const startY = e.clientY
    const ox = node.x
    const oy = node.y
    let dragging = false
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / zoom
      const dy = (ev.clientY - startY) / zoom
      if (!dragging && dx * dx + dy * dy < 9) return
      dragging = true
      onMove(node.id, ox + dx, oy + dy, lockedMembers)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const beginResize = (e: ReactPointerEvent, handle: Handle) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    onRequestHandles(node.id)
    const startX = e.clientX
    const startY = e.clientY
    const { x, y, width, height } = node
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / zoom
      const dy = (ev.clientY - startY) / zoom
      let nx = x
      let ny = y
      let nw = width
      let nh = height
      if (handle.includes('e')) nw = width + dx
      if (handle.includes('s')) nh = height + dy
      if (handle.includes('w')) {
        nx = x + dx
        nw = width - dx
      }
      if (handle.includes('n')) {
        ny = y + dy
        nh = height - dy
      }
      onResize(node.id, nx, ny, nw, nh)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <article
      className={`group-frame${selected ? ' selected' : ''}`}
      data-node-id={node.id}
      data-node-kind="group"
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        background: bodyColor,
      }}
    >
      <div
        className="group-titlebar"
        style={{ background: titlebarColor }}
        onPointerDown={beginMove}
      >
        <span className="group-title-label">{data.title || '分组'}</span>
      </div>

      {showHandles &&
        (['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as Handle[]).map((h) => (
          <div
            key={h}
            className={`group-handle handle-${h}`}
            onPointerDown={(e) => beginResize(e, h)}
          />
        ))}
    </article>
  )
}
