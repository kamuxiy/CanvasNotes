import { useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { CanvasNode, DateData, ListData, NoteData, Socket } from '../types'
import { NODE_KIND_LABEL, SOCKET_COLORS } from '../types'
import { kindsCompatible } from '../store'
import { SocketPort } from './SocketPort'

type NodeCardProps = {
  node: CanvasNode
  selected: boolean
  selectedIds?: string[]
  zoom: number
  wiringFromKind?: Socket['kind'] | null
  activeSocketId?: string | null
  onSelect: (id: string, additive: boolean) => void
  onMove: (id: string, x: number, y: number) => void
  onMoveMany?: (moves: { id: string; x: number; y: number }[]) => void
  /** All canvas nodes — used to resolve multi-drag start positions */
  allNodes?: CanvasNode[]
  onUpdateData: (id: string, data: CanvasNode['data']) => void
  onHeight?: (id: string, height: number) => void
  onSocketPointerDown: (e: ReactPointerEvent, nodeId: string, socket: Socket) => void
  onSocketEnter: (nodeId: string, socket: Socket) => void
  onSocketLeave: () => void
  onRenameSocket: (nodeId: string, socketId: string, name: string) => void
  onRemoveSocket: (nodeId: string, socketId: string) => void
  onSocketOffsets: (nodeId: string, offsets: Record<string, number>) => void
}

function NoteFields({
  data,
  onChange,
  accent,
}: {
  data: NoteData
  onChange: (data: NoteData) => void
  accent: string
}) {
  return (
    <>
      <div className="ul-row">
        <div className="ul-row-label">
          <span className="glyph" />
          标题
        </div>
        <input
          type="text"
          value={data.title}
          placeholder="标题"
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          onPointerDown={(e) => e.stopPropagation()}
        />
        <div className="ul-bar">
          <span
            style={{
              width: `${Math.min(100, Math.max(12, data.title.length * 8))}%`,
              background: accent,
            }}
          />
        </div>
      </div>
      <div className="ul-row">
        <div className="ul-row-label">
          <span className="glyph" />
          记事内容
        </div>
        <textarea
          value={data.body}
          placeholder="记事内容…"
          onChange={(e) => onChange({ ...data, body: e.target.value })}
          onPointerDown={(e) => e.stopPropagation()}
        />
      </div>
    </>
  )
}

function DateFields({
  data,
  onChange,
  accent,
}: {
  data: DateData
  onChange: (data: DateData) => void
  accent: string
}) {
  return (
    <>
      <div className="ul-row">
        <div className="ul-row-label">
          <span className="glyph" />
          日程名称
        </div>
        <input
          type="text"
          value={data.label}
          placeholder="日程名称"
          onChange={(e) => onChange({ ...data, label: e.target.value })}
          onPointerDown={(e) => e.stopPropagation()}
        />
        <div className="ul-bar">
          <span style={{ width: '62%', background: accent }} />
        </div>
      </div>
      <div className="date-grid">
        <label>
          开始日期
          <input
            type="date"
            value={data.startDate}
            onChange={(e) => onChange({ ...data, startDate: e.target.value })}
            onPointerDown={(e) => e.stopPropagation()}
          />
        </label>
        <label>
          截止日期
          <input
            type="date"
            value={data.endDate}
            onChange={(e) => onChange({ ...data, endDate: e.target.value })}
            onPointerDown={(e) => e.stopPropagation()}
          />
        </label>
      </div>
    </>
  )
}

function ListFields({
  data,
  onChange,
  accent,
}: {
  data: ListData
  onChange: (data: ListData) => void
  accent: string
}) {
  const filled = data.items.filter((i) => i.trim()).length
  const ratio = Math.max(8, Math.round((filled / Math.max(data.items.length, 1)) * 100))
  return (
    <>
      <div className="ul-row">
        <div className="ul-row-label">
          <span className="glyph" />
          列表标题
        </div>
        <input
          type="text"
          value={data.title}
          placeholder="列表标题"
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          onPointerDown={(e) => e.stopPropagation()}
        />
        <div className="ul-bar">
          <span style={{ width: `${ratio}%`, background: accent }} />
        </div>
      </div>
      {data.items.map((item, index) => (
        <div className="list-item-row" key={index}>
          <input
            type="text"
            value={item}
            placeholder={`条目 ${index + 1}`}
            onChange={(e) => {
              const items = [...data.items]
              items[index] = e.target.value
              onChange({ ...data, items })
            }}
            onPointerDown={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="mini-btn"
            title="删除条目"
            onClick={() => {
              const items = data.items.filter((_, i) => i !== index)
              onChange({ ...data, items: items.length ? items : [''] })
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            −
          </button>
        </div>
      ))}
      <button
        type="button"
        className="mini-btn"
        onClick={() => onChange({ ...data, items: [...data.items, ''] })}
        onPointerDown={(e) => e.stopPropagation()}
      >
        + 条目
      </button>
    </>
  )
}

export function getSocketWorldPos(
  node: CanvasNode,
  socket: Socket,
  offsetY: number,
): { x: number; y: number } {
  const y = node.y + offsetY
  const x = socket.side === 'left' ? node.x : node.x + node.width
  return { x, y }
}

export function NodeCard({
  node,
  selected,
  selectedIds = [],
  zoom,
  wiringFromKind,
  activeSocketId,
  onSelect,
  onMove,
  onMoveMany,
  allNodes = [],
  onUpdateData,
  onHeight,
  onSocketPointerDown,
  onSocketEnter,
  onSocketLeave,
  onRenameSocket,
  onRemoveSocket,
  onSocketOffsets,
}: NodeCardProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const socketAreaRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(160)

  const accent =
    node.kind === 'note'
      ? SOCKET_COLORS.event
      : node.kind === 'date'
        ? SOCKET_COLORS.date
        : SOCKET_COLORS.info

  const iconGlyph = node.kind === 'note' ? 'N' : node.kind === 'date' ? 'D' : 'L'

  useLayoutEffect(() => {
    if (node.kind === 'group') return
    const el = rootRef.current
    if (!el) return
    const measure = () => {
      const h = el.offsetHeight
      setHeight(h)
      onHeight?.(node.id, h)
      const rootRect = el.getBoundingClientRect()
      const next: Record<string, number> = {}
      el.querySelectorAll<HTMLElement>('[data-socket-id].socket-dot').forEach((dot) => {
        const id = dot.dataset.socketId
        if (!id) return
        const r = dot.getBoundingClientRect()
        // world Y relative to node top (unscaled: divide by zoom)
        next[id] = (r.top + r.height / 2 - rootRect.top) / zoom
      })
      onSocketOffsets(node.id, next)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    if (socketAreaRef.current) ro.observe(socketAreaRef.current)
    return () => ro.disconnect()
  }, [node.data, node.sockets, node.id, node.kind, zoom, onSocketOffsets, onHeight, height])

  if (node.kind === 'group') return null

  return (
    <article
      ref={rootRef}
      className={`node${selected ? ' selected' : ''}`}
      data-node-id={node.id}
      data-node-height={height}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
      }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('.socket-dot')) return
        onSelect(node.id, e.shiftKey)
      }}
    >
      <div
        className="node-header"
        onPointerDown={(e) => {
          if (e.button !== 0) return
          const target = e.target as HTMLElement
          if (target.closest('button, input, textarea, select, a')) return
          e.stopPropagation()
          onSelect(node.id, e.shiftKey)
          const startX = e.clientX
          const startY = e.clientY
          const origX = node.x
          const origY = node.y
          const multiDrag =
            selectedIds.includes(node.id) &&
            selectedIds.length > 1 &&
            onMoveMany != null
          const peerOrigins = multiDrag
            ? allNodes
                .filter(
                  (n) =>
                    selectedIds.includes(n.id) &&
                    n.id !== node.id &&
                    n.kind !== 'group',
                )
                .map((n) => ({ id: n.id, x: n.x, y: n.y }))
            : []
          let dragging = false
          const move = (ev: PointerEvent) => {
            const dx = ev.clientX - startX
            const dy = ev.clientY - startY
            if (!dragging && dx * dx + dy * dy < 9) return
            dragging = true
            const worldDx = dx / zoom
            const worldDy = dy / zoom
            if (multiDrag && onMoveMany) {
              const moves = [
                { id: node.id, x: origX + worldDx, y: origY + worldDy },
                ...peerOrigins.map((p) => ({
                  id: p.id,
                  x: p.x + worldDx,
                  y: p.y + worldDy,
                })),
              ]
              onMoveMany(moves)
            } else {
              onMove(node.id, origX + worldDx, origY + worldDy)
            }
          }
          const up = () => {
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', up)
          }
          window.addEventListener('pointermove', move)
          window.addEventListener('pointerup', up)
        }}
      >
        <div className="node-title-wrap">
          <span className="node-icon">{iconGlyph}</span>
          <span className="node-kind">{NODE_KIND_LABEL[node.kind]}</span>
        </div>
      </div>

      <div className="node-body">
        {node.kind === 'note' && (
          <NoteFields
            data={node.data as NoteData}
            accent={accent}
            onChange={(data) => onUpdateData(node.id, data)}
          />
        )}
        {node.kind === 'date' && (
          <DateFields
            data={node.data as DateData}
            accent={accent}
            onChange={(data) => onUpdateData(node.id, data)}
          />
        )}
        {node.kind === 'list' && (
          <ListFields
            data={node.data as ListData}
            accent={accent}
            onChange={(data) => onUpdateData(node.id, data)}
          />
        )}
      </div>

      <div className="socket-section" ref={socketAreaRef}>
        {node.sockets.map((socket) => (
          <SocketPort
            key={socket.id}
            socket={socket}
            active={activeSocketId === socket.id}
            compatible={
              wiringFromKind == null || kindsCompatible(wiringFromKind, socket.kind)
            }
            onPointerDown={(e, s) => onSocketPointerDown(e, node.id, s)}
            onPointerEnter={(s) => onSocketEnter(node.id, s)}
            onPointerLeave={onSocketLeave}
            onDoubleClick={(s) => {
              const next = window.prompt('连接点名称', s.name)
              if (next != null && next.trim()) {
                onRenameSocket(node.id, s.id, next.trim())
              }
            }}
            onContextMenu={(_e, s) => {
              if (window.confirm('删除该连接点？')) {
                onRemoveSocket(node.id, s.id)
              }
            }}
          />
        ))}
      </div>
    </article>
  )
}
