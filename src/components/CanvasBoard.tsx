import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react'
import { getSocketWorldPos, NodeCard } from './NodeCard'
import { SocketDialog } from './SocketDialog'
import { bezierPath, clamp, screenToWorld } from '../utils/geometry'
import { kindsCompatible } from '../store'
import type {
  AppState,
  CanvasNode,
  Connection,
  NodeKind,
  Socket,
  SocketKind,
  SocketSide,
  Viewport,
} from '../types'
import { SOCKET_COLORS, SOCKET_KIND_LABEL } from '../types'

type CanvasBoardProps = {
  state: AppState
  setViewport: (viewport: Viewport) => void
  addNode: (kind: NodeKind, x: number, y: number) => void
  updateNodeData: (id: string, data: CanvasNode['data']) => void
  moveNode: (id: string, x: number, y: number) => void
  deleteNodes: (ids: string[]) => void
  addSocket: (nodeId: string, side: SocketSide, kind: SocketKind, name: string) => void
  renameSocket: (nodeId: string, socketId: string, name: string) => void
  removeSocket: (nodeId: string, socketId: string) => void
  tryConnect: (
    aNodeId: string,
    aSocketId: string,
    bNodeId: string,
    bSocketId: string,
  ) => void
  deleteConnection: (id: string) => void
  pendingAddKind: NodeKind | null
  onConsumedAdd: () => void
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  socketDialogRequest: { nodeId: string; side: SocketSide } | null
  onSocketDialogHandled: () => void
}

type WireDraft = {
  nodeId: string
  socketId: string
  kind: SocketKind
  side: SocketSide
  x: number
  y: number
}

export function CanvasBoard({
  state,
  setViewport,
  addNode,
  updateNodeData,
  moveNode,
  deleteNodes,
  addSocket,
  renameSocket,
  removeSocket,
  tryConnect,
  deleteConnection,
  pendingAddKind,
  onConsumedAdd,
  selectedIds,
  onSelectionChange,
  socketDialogRequest,
  onSocketDialogHandled,
}: CanvasBoardProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef(state.viewport)
  viewportRef.current = state.viewport
  const nodesRef = useRef(state.nodes)
  nodesRef.current = state.nodes
  const [spaceDown, setSpaceDown] = useState(false)
  const [panning, setPanning] = useState(false)
  const [draft, setDraft] = useState<WireDraft | null>(null)
  const [cursorWorld, setCursorWorld] = useState({ x: 0, y: 0 })
  const [hoverTarget, setHoverTarget] = useState<{
    nodeId: string
    socket: Socket
  } | null>(null)
  const [socketDialog, setSocketDialog] = useState<{
    nodeId: string
    side: SocketSide
  } | null>(null)
  const [socketOffsets, setSocketOffsets] = useState<
    Record<string, Record<string, number>>
  >({})

  const { nodes, connections, viewport } = state

  useEffect(() => {
    if (!socketDialogRequest) return
    setSocketDialog(socketDialogRequest)
    onSocketDialogHandled()
  }, [socketDialogRequest, onSocketDialogHandled])

  const handleSocketOffsets = useCallback(
    (nodeId: string, offsets: Record<string, number>) => {
      setSocketOffsets((prev) => {
        const cur = prev[nodeId]
        const keys = Object.keys(offsets)
        if (
          cur &&
          keys.length === Object.keys(cur).length &&
          keys.every((k) => Math.abs((cur[k] ?? 0) - offsets[k]) < 0.5)
        ) {
          return prev
        }
        return { ...prev, [nodeId]: offsets }
      })
    },
    [],
  )

  const resolveSocketPos = useCallback(
    (nodeId: string, socketId: string) => {
      const node = nodes.find((n) => n.id === nodeId)
      const socket = node?.sockets.find((s) => s.id === socketId)
      if (!node || !socket) return null
      const offsetY = socketOffsets[nodeId]?.[socketId]
      if (offsetY == null) {
        const idx = node.sockets.findIndex((s) => s.id === socketId)
        return getSocketWorldPos(node, socket, 56 + idx * 28)
      }
      return getSocketWorldPos(node, socket, offsetY)
    },
    [nodes, socketOffsets],
  )

  const wirePaths = useMemo(() => {
    return connections
      .map((c) => {
        const from = resolveSocketPos(c.fromNodeId, c.fromSocketId)
        const to = resolveSocketPos(c.toNodeId, c.toSocketId)
        if (!from || !to) return null
        const fromSock = nodes
          .find((n) => n.id === c.fromNodeId)
          ?.sockets.find((s) => s.id === c.fromSocketId)
        return {
          connection: c,
          d: bezierPath(from.x, from.y, to.x, to.y),
          color: fromSock ? SOCKET_COLORS[fromSock.kind] : '#888',
        }
      })
      .filter(Boolean) as {
      connection: Connection
      d: string
      color: string
    }[]
  }, [connections, resolveSocketPos, nodes])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        e.preventDefault()
        setSpaceDown(true)
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        if (selectedIds.length) {
          e.preventDefault()
          deleteNodes(selectedIds)
          onSelectionChange([])
        }
      }
      if (e.key === 'Escape') {
        setDraft(null)
        onSelectionChange([])
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceDown(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [selectedIds, deleteNodes, onSelectionChange])

  const onWheel = (e: ReactWheelEvent) => {
    e.preventDefault()
    const root = rootRef.current
    if (!root) return
    const rect = root.getBoundingClientRect()
    const vp = viewportRef.current
    const world = screenToWorld(e.clientX, e.clientY, rect, vp)
    const factor = e.deltaY > 0 ? 0.92 : 1.08
    const zoom = clamp(vp.zoom * factor, 0.35, 2.5)
    const x = e.clientX - rect.left - world.x * zoom
    const y = e.clientY - rect.top - world.y * zoom
    setViewport({ x, y, zoom })
  }

  const setViewportRef = useRef(setViewport)
  setViewportRef.current = setViewport

  const beginPan = (e: ReactPointerEvent) => {
    const startX = e.clientX
    const startY = e.clientY
    const ox = viewportRef.current.x
    const oy = viewportRef.current.y
    const zoom = viewportRef.current.zoom
    setPanning(true)
    const move = (ev: PointerEvent) => {
      setViewportRef.current({
        zoom,
        x: ox + (ev.clientX - startX),
        y: oy + (ev.clientY - startY),
      })
    }
    const up = () => {
      setPanning(false)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const handleCanvasPointerDown = (e: ReactPointerEvent) => {
    if (pendingAddKind) {
      const root = rootRef.current
      if (!root) return
      const rect = root.getBoundingClientRect()
      const world = screenToWorld(e.clientX, e.clientY, rect, viewportRef.current)
      addNode(pendingAddKind, world.x - 120, world.y - 40)
      onConsumedAdd()
      return
    }

    if (e.button === 0 || e.button === 1 || e.button === 2) {
      e.preventDefault()
      if (e.button === 0) onSelectionChange([])
      beginPan(e)
    }
  }

  const handleSocketPointerDown = (
    e: ReactPointerEvent,
    nodeId: string,
    socket: Socket,
  ) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const pos = resolveSocketPos(nodeId, socket.id)
    if (!pos) return
    setDraft({
      nodeId,
      socketId: socket.id,
      kind: socket.kind,
      side: socket.side,
      x: pos.x,
      y: pos.y,
    })
    setCursorWorld(pos)

    const root = rootRef.current
    const move = (ev: PointerEvent) => {
      if (!root) return
      const rect = root.getBoundingClientRect()
      setCursorWorld(screenToWorld(ev.clientX, ev.clientY, rect, viewportRef.current))
      const el = document.elementFromPoint(ev.clientX, ev.clientY)
      const socketEl = el?.closest('[data-socket-id]') as HTMLElement | null
      const nodeEl = socketEl?.closest('[data-node-id]') as HTMLElement | null
      if (socketEl && nodeEl) {
        const sid = socketEl.dataset.socketId
        const nid = nodeEl.dataset.nodeId
        const n = nodesRef.current.find((x) => x.id === nid)
        const s = n?.sockets.find((x) => x.id === sid)
        if (n && s) setHoverTarget({ nodeId: n.id, socket: s })
        else setHoverTarget(null)
      } else {
        setHoverTarget(null)
      }
    }
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      const el = document.elementFromPoint(ev.clientX, ev.clientY)
      const socketEl = el?.closest('[data-socket-id]') as HTMLElement | null
      const nodeEl = socketEl?.closest('[data-node-id]') as HTMLElement | null
      let target = hoverTargetRef.current
      if (socketEl && nodeEl) {
        const sid = socketEl.dataset.socketId
        const nid = nodeEl.dataset.nodeId
        const n = nodesRef.current.find((x) => x.id === nid)
        const s = n?.sockets.find((x) => x.id === sid)
        if (n && s) target = { nodeId: n.id, socket: s }
      }
      setDraft((current) => {
        if (current && target) {
          if (
            target.nodeId !== current.nodeId &&
            kindsCompatible(target.socket.kind, current.kind) &&
            target.socket.side !== current.side
          ) {
            tryConnect(current.nodeId, current.socketId, target.nodeId, target.socket.id)
          }
        }
        return null
      })
      setHoverTarget(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const hoverTargetRef = useRef(hoverTarget)
  hoverTargetRef.current = hoverTarget

  const draftPath = useMemo(() => {
    if (!draft) return null
    const fromRight = draft.side === 'right'
    const x1 = fromRight ? draft.x : cursorWorld.x
    const y1 = fromRight ? draft.y : cursorWorld.y
    const x2 = fromRight ? cursorWorld.x : draft.x
    const y2 = fromRight ? cursorWorld.y : draft.y
    return {
      d: bezierPath(x1, y1, x2, y2),
      color: SOCKET_COLORS[draft.kind],
    }
  }, [draft, cursorWorld])

  return (
    <div
      className={`canvas-root${panning || spaceDown ? ' panning' : ''}${draft ? ' wiring' : ''}`}
      ref={rootRef}
      onWheel={onWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="canvas-pan-layer" onPointerDown={handleCanvasPointerDown} />
      <div
        className="canvas-world"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        }}
      >
        <svg className="wires-layer">
          {wirePaths.map(({ connection, d, color }) => (
            <g key={connection.id}>
              <path
                className="hit"
                d={d}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  if (e.button === 0 || e.button === 2) {
                    deleteConnection(connection.id)
                  }
                }}
              />
              <path d={d} stroke={color} style={{ color }} opacity={0.95} />
            </g>
          ))}
          {draftPath && (
            <path
              d={draftPath.d}
              stroke={draftPath.color}
              strokeDasharray="5 4"
              opacity={0.85}
            />
          )}
        </svg>

        {nodes.map((node) => (
          <NodeCard
            key={node.id}
            node={node}
            selected={selectedIds.includes(node.id)}
            zoom={viewport.zoom}
            wiringFromKind={draft?.kind ?? null}
            activeSocketId={draft?.socketId}
            onSelect={(id, additive) => {
              if (additive) {
                onSelectionChange(
                  selectedIds.includes(id)
                    ? selectedIds.filter((x) => x !== id)
                    : [...selectedIds, id],
                )
              } else {
                onSelectionChange([id])
              }
            }}
            onMove={moveNode}
            onUpdateData={updateNodeData}
            onSocketPointerDown={handleSocketPointerDown}
            onSocketEnter={(nodeId, socket) => setHoverTarget({ nodeId, socket })}
            onSocketLeave={() => setHoverTarget(null)}
            onRenameSocket={renameSocket}
            onRemoveSocket={removeSocket}
            onSocketOffsets={handleSocketOffsets}
          />
        ))}
      </div>

      {nodes.length === 0 && (
        <div className="empty-hint">
          画布为空
          <br />
          使用底部工具栏添加便签、日期或列表节点
        </div>
      )}

      {pendingAddKind && (
        <div
          style={{
            position: 'absolute',
            left: 12,
            bottom: 72,
            background: '#1d2330',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 12,
            color: 'var(--text-dim)',
            pointerEvents: 'none',
          }}
        >
          点击画布放置节点（Esc 取消）
        </div>
      )}

      <SocketDialog
        open={!!socketDialog}
        defaultSide={socketDialog?.side ?? 'right'}
        onClose={() => setSocketDialog(null)}
        onSubmit={({ name, kind, side }) => {
          if (!socketDialog) return
          addSocket(socketDialog.nodeId, side, kind, name)
        }}
      />
    </div>
  )
}

export function StatusBar({
  nodeCount,
  connectionCount,
  zoom,
}: {
  nodeCount: number
  connectionCount: number
  zoom: number
}) {
  return (
    <footer className="status-bar">
      <span>
        节点 {nodeCount} · 连线 {connectionCount} · 缩放 {Math.round(zoom * 100)}%
      </span>
      <div className="legend">
        {(Object.keys(SOCKET_KIND_LABEL) as SocketKind[]).map((k) => (
          <span className="legend-item" key={k}>
            <span className="legend-dot" style={{ background: SOCKET_COLORS[k] }} />
            {SOCKET_KIND_LABEL[k]}
          </span>
        ))}
      </div>
      <span style={{ marginLeft: 'auto' }}>
        左↔右连线 · 通用可接任意类型 · 可多连
      </span>
    </footer>
  )
}
