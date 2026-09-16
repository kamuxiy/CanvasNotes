import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { marked } from 'marked'
import type {
  CanvasNode,
  DateData,
  ListData,
  MarkdownData,
  NoteData,
  Socket,
} from '../types'
import { MARKDOWN_ACCENT, NODE_KIND_LABEL, SOCKET_COLORS } from '../types'
import { kindsCompatible } from '../store'
import { extractMarkdownH1 } from '../utils/markdown'
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
  onPatchNode: (id: string, patch: Partial<CanvasNode>) => void
  onHeight?: (id: string, height: number) => void
  onNodeContextMenu?: (id: string, clientX: number, clientY: number) => void
  onSocketPointerDown: (e: ReactPointerEvent, nodeId: string, socket: Socket) => void
  onSocketEnter: (nodeId: string, socket: Socket) => void
  onSocketLeave: () => void
  onRenameSocket: (nodeId: string, socketId: string, name: string) => void
  onSocketOffsets: (nodeId: string, offsets: Record<string, number>) => void
}

const FIELD_SELECTOR = 'input, textarea, select, button, a, label'

/** Survives NodeCard remounts so Markdown preview mode is not lost. */
const markdownModeByNodeId = new Map<string, 'edit' | 'preview'>()

/**
 * Keep focus on text fields.
 * Use both pointerdown and mousedown — canvas/node drag handlers otherwise steal the gesture.
 * Do not preventDefault (that blocks caret placement in Chromium/Electron).
 */
function fieldPointerDown(e: ReactPointerEvent) {
  e.stopPropagation()
}

function fieldMouseDown(e: ReactMouseEvent) {
  e.stopPropagation()
}

function fieldSingleKeyDown(e: ReactKeyboardEvent) {
  if (e.key === 'Enter') e.preventDefault()
}

/** Keep textarea tall enough to show all content (width is user-resizable). */
function autoSizeTextarea(el: HTMLTextAreaElement) {
  const min = el.classList.contains('md-editor')
    ? 64
    : el.classList.contains('field-single')
      ? 28
      : 48
  el.style.height = 'auto'
  el.style.height = `${Math.max(min, el.scrollHeight)}px`
}

function fieldStyle(size?: { width: number }) {
  if (!size?.width) return undefined
  return {
    width: size.width,
    maxWidth: 'none',
  } as const
}

function NoteFields({
  data,
  onChange,
  accent,
  onFieldFocus,
  fieldSizes,
}: {
  data: NoteData
  onChange: (data: NoteData) => void
  accent: string
  onFieldFocus?: () => void
  fieldSizes?: Record<string, { width: number }>
}) {
  return (
    <>
      <div className="ul-row">
        <textarea
          className="field-single"
          data-field-key="title"
          rows={1}
          value={data.title}
          placeholder="标题"
          style={fieldStyle(fieldSizes?.title)}
          onChange={(e) => {
            onChange({ ...data, title: e.target.value })
            autoSizeTextarea(e.target)
          }}
          onPointerDown={fieldPointerDown}
          onKeyDown={fieldSingleKeyDown}
          onMouseDown={fieldMouseDown}
          onFocus={onFieldFocus}
        />
        <div className="ul-bar">
          <span style={{ width: '100%', background: accent }} />
        </div>
      </div>
      <div className="ul-row">
        <textarea
          data-field-key="body"
          value={data.body}
          placeholder="记事内容…"
          style={fieldStyle(fieldSizes?.body)}
          onChange={(e) => {
            onChange({ ...data, body: e.target.value })
            autoSizeTextarea(e.target)
          }}
          onPointerDown={fieldPointerDown}
          onMouseDown={fieldMouseDown}
          onFocus={onFieldFocus}
        />
      </div>
    </>
  )
}

function DateFields({
  data,
  onChange,
  accent,
  onFieldFocus,
  fieldSizes,
}: {
  data: DateData
  onChange: (data: DateData) => void
  accent: string
  onFieldFocus?: () => void
  fieldSizes?: Record<string, { width: number }>
}) {
  return (
    <>
      <div className="ul-row">
        <textarea
          className="field-single"
          data-field-key="label"
          rows={1}
          value={data.label}
          placeholder="日程名称"
          style={fieldStyle(fieldSizes?.label)}
          onChange={(e) => {
            onChange({ ...data, label: e.target.value })
            autoSizeTextarea(e.target)
          }}
          onPointerDown={fieldPointerDown}
          onKeyDown={fieldSingleKeyDown}
          onMouseDown={fieldMouseDown}
          onFocus={onFieldFocus}
        />
        <div className="ul-bar">
          <span style={{ width: '100%', background: accent }} />
        </div>
      </div>
      <div className="date-grid">
        <label>
          开始日期
          <input
            type="date"
            value={data.startDate}
            onChange={(e) => onChange({ ...data, startDate: e.target.value })}
            onPointerDown={fieldPointerDown}
            onMouseDown={fieldMouseDown}
            onFocus={onFieldFocus}
          />
        </label>
        <label>
          截止日期
          <input
            type="date"
            value={data.endDate}
            onChange={(e) => onChange({ ...data, endDate: e.target.value })}
            onPointerDown={fieldPointerDown}
            onMouseDown={fieldMouseDown}
            onFocus={onFieldFocus}
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
  onFieldFocus,
  fieldSizes,
}: {
  data: ListData
  onChange: (data: ListData) => void
  accent: string
  onFieldFocus?: () => void
  fieldSizes?: Record<string, { width: number }>
}) {
  return (
    <>
      <div className="ul-row">
        <textarea
          className="field-single"
          data-field-key="title"
          rows={1}
          value={data.title}
          placeholder="列表标题"
          style={fieldStyle(fieldSizes?.title)}
          onChange={(e) => {
            onChange({ ...data, title: e.target.value })
            autoSizeTextarea(e.target)
          }}
          onPointerDown={fieldPointerDown}
          onKeyDown={fieldSingleKeyDown}
          onMouseDown={fieldMouseDown}
          onFocus={onFieldFocus}
        />
        <div className="ul-bar">
          <span style={{ width: '100%', background: accent }} />
        </div>
      </div>
      {data.items.map((item, index) => (
        <div className="list-item-row" key={index}>
          <textarea
            className="field-single"
            data-field-key={`item-${index}`}
            rows={1}
            value={item}
            placeholder={`条目 ${index + 1}`}
            style={fieldStyle(fieldSizes?.[`item-${index}`])}
            onChange={(e) => {
              const items = [...data.items]
              items[index] = e.target.value
              onChange({ ...data, items })
              autoSizeTextarea(e.target)
            }}
            onPointerDown={fieldPointerDown}
            onKeyDown={fieldSingleKeyDown}
            onMouseDown={fieldMouseDown}
            onFocus={onFieldFocus}
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

function MarkdownFields({
  nodeId,
  data,
  onChange,
  accent,
  onFieldFocus,
  fieldSizes,
}: {
  nodeId: string
  data: MarkdownData
  onChange: (data: MarkdownData) => void
  accent: string
  onFieldFocus?: () => void
  fieldSizes?: Record<string, { width: number }>
}) {
  const [mode, setMode] = useState<'edit' | 'preview'>(
    () => markdownModeByNodeId.get(nodeId) ?? 'edit',
  )
  const setViewMode = (next: 'edit' | 'preview') => {
    markdownModeByNodeId.set(nodeId, next)
    setMode(next)
  }
  const html = useMemo(() => {
    try {
      const raw = marked.parse(data.content || '', { async: false })
      return typeof raw === 'string' ? raw : '<p></p>'
    } catch {
      return '<p></p>'
    }
  }, [data.content])

  return (
    <>
      <div className="md-toolbar" data-md-mode={mode}>
        <button
          type="button"
          className={`mini-btn${mode === 'edit' ? ' active' : ''}`}
          aria-pressed={mode === 'edit'}
          onPointerDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setViewMode('edit')
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setViewMode('edit')
          }}
        >
          编辑
        </button>
        <button
          type="button"
          className={`mini-btn${mode === 'preview' ? ' active' : ''}`}
          aria-pressed={mode === 'preview'}
          onPointerDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setViewMode('preview')
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setViewMode('preview')
          }}
        >
          预览
        </button>
        <div className="ul-bar md-bar">
          <span style={{ width: '100%', background: accent }} />
        </div>
      </div>
      {mode === 'edit' ? (
        <div className="ul-row">
          <textarea
            className="md-editor"
            data-field-key="content"
            value={data.content}
            placeholder={'# 标题\n\n正文…'}
            style={fieldStyle(fieldSizes?.content)}
            onChange={(e) => {
              const content = e.target.value
              const h1 = extractMarkdownH1(content)
              onChange({
                content,
                title: h1 ?? (data.title.trim() || 'Markdown'),
              })
              autoSizeTextarea(e.target)
            }}
            onPointerDown={fieldPointerDown}
            onMouseDown={fieldMouseDown}
            onFocus={onFieldFocus}
          />
        </div>
      ) : (
        <div
          className="md-preview"
          data-md-preview="true"
          dangerouslySetInnerHTML={{
            __html: html.trim() ? html : '<p class="md-preview-empty">（预览）</p>',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        />
      )}
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
  onPatchNode,
  onHeight,
  onNodeContextMenu,
  onSocketPointerDown,
  onSocketEnter,
  onSocketLeave,
  onRenameSocket,
  onSocketOffsets,
}: NodeCardProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const socketAreaRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(160)
  const fieldSizes = node.fieldSizes ?? {}
  const sizesRef = useRef(fieldSizes)
  sizesRef.current = fieldSizes

  // Persist user width tweaks; auto-size height to content; grow the node card with fields.
  useEffect(() => {
    if (node.kind === 'group') return
    const root = rootRef.current
    if (!root) return
    let timer: number | undefined
    const flush = (
      sizes: Record<string, { width: number }>,
      nextWidth: number,
      nextHeight: number,
    ) => {
      const patch: Partial<CanvasNode> = { fieldSizes: sizes }
      if (Math.abs(nextWidth - node.width) >= 1) patch.width = nextWidth
      if (Math.abs(nextHeight - node.height) >= 1) patch.height = nextHeight
      onPatchNode(node.id, patch)
    }
    const measure = () => {
      const areas = root.querySelectorAll<HTMLTextAreaElement>('textarea[data-field-key]')
      if (!areas.length) return
      const nextSizes: Record<string, { width: number }> = { ...sizesRef.current }
      let changed = false
      let maxFieldRight = 0
      const bodyPad = 20
      areas.forEach((el) => {
        const key = el.dataset.fieldKey
        if (!key) return
        autoSizeTextarea(el)
        const inlineW = Number.parseFloat(el.style.width)
        const hasUserWidth = Number.isFinite(inlineW) && inlineW > 0
        const width = Math.round(
          hasUserWidth ? inlineW : el.offsetWidth,
        )
        if (hasUserWidth) {
          const prev = nextSizes[key]
          if (!prev || prev.width !== width) {
            nextSizes[key] = { width }
            changed = true
          }
        }
        maxFieldRight = Math.max(maxFieldRight, width)
      })
      const neededWidth = Math.max(node.width, maxFieldRight + bodyPad + 8)
      const neededHeight = Math.max(node.height, Math.round(root.offsetHeight))
      if (!changed && neededWidth === node.width && neededHeight === node.height) return
      window.clearTimeout(timer)
      timer = window.setTimeout(() => flush(nextSizes, neededWidth, neededHeight), 60)
    }
    // Initial content-fit pass
    measure()
    const ro = new ResizeObserver(measure)
    const observeFields = () => {
      root.querySelectorAll('textarea[data-field-key]').forEach((el) => ro.observe(el))
    }
    observeFields()
    const mo = new MutationObserver(() => {
      observeFields()
      measure()
    })
    mo.observe(root, { childList: true, subtree: true })
    return () => {
      window.clearTimeout(timer)
      ro.disconnect()
      mo.disconnect()
    }
  }, [node.id, node.kind, node.width, node.height, node.data, onPatchNode])

  // Re-fit heights whenever content / width styles change (e.g. typing).
  useLayoutEffect(() => {
    if (node.kind === 'group') return
    const root = rootRef.current
    if (!root) return
    root.querySelectorAll<HTMLTextAreaElement>('textarea[data-field-key]').forEach(autoSizeTextarea)
  }, [node.id, node.kind, node.data, node.fieldSizes, node.width])

  const accent =
    node.kind === 'note'
      ? SOCKET_COLORS.event
      : node.kind === 'date'
        ? SOCKET_COLORS.date
        : node.kind === 'markdown'
          ? MARKDOWN_ACCENT
          : SOCKET_COLORS.info

  const iconGlyph =
    node.kind === 'note'
      ? 'N'
      : node.kind === 'date'
        ? 'D'
        : node.kind === 'markdown'
          ? 'M'
          : 'L'

  const headerTitle =
    node.kind === 'markdown'
      ? (node.data as MarkdownData).title || 'Markdown'
      : NODE_KIND_LABEL[node.kind]

  useLayoutEffect(() => {
    if (node.kind === 'group') return
    const el = rootRef.current
    if (!el) return
    const measure = () => {
      const h = el.offsetHeight
      setHeight((prev) => (prev === h ? prev : h))
      onHeight?.(node.id, h)
      if (Math.abs(h - node.height) >= 2) {
        onPatchNode(node.id, { height: h })
      }
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
    // ResizeObserver covers content size changes; avoid re-binding on every keystroke.
  }, [node.sockets, node.id, node.kind, zoom, onSocketOffsets, onHeight])

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
        // Figma-style typed border: note=orange, date=blue, list=green, md=purple
        ['--node-accent' as string]: accent,
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onSelect(node.id, e.shiftKey)
        onNodeContextMenu?.(node.id, e.clientX, e.clientY)
      }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('.socket-dot')) return
        const target = e.target as HTMLElement
        // Form controls / markdown chrome: never select here — selection races the caret.
        if (target.closest(`${FIELD_SELECTOR}, .md-toolbar, .md-preview`)) {
          e.stopPropagation()
          return
        }
        onSelect(node.id, e.shiftKey)
      }}
    >
      <div
        className="node-header"
        onPointerDown={(e) => {
          if (e.button !== 0) return
          const target = e.target as HTMLElement
          if (target.closest(FIELD_SELECTOR)) return
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
          <span className="node-icon" style={node.kind === 'markdown' ? { background: accent } : undefined}>
            {iconGlyph}
          </span>
          <span className="node-kind" title={headerTitle}>
            {headerTitle}
          </span>
        </div>
      </div>

      <div className="node-body">
        {node.kind === 'note' && (
          <NoteFields
            data={node.data as NoteData}
            accent={accent}
            fieldSizes={fieldSizes}
            onChange={(data) => onUpdateData(node.id, data)}
            onFieldFocus={() => {
              if (!selected) queueMicrotask(() => onSelect(node.id, false))
            }}
          />
        )}
        {node.kind === 'date' && (
          <DateFields
            data={node.data as DateData}
            accent={accent}
            fieldSizes={fieldSizes}
            onChange={(data) => onUpdateData(node.id, data)}
            onFieldFocus={() => {
              if (!selected) queueMicrotask(() => onSelect(node.id, false))
            }}
          />
        )}
        {node.kind === 'list' && (
          <ListFields
            data={node.data as ListData}
            accent={accent}
            fieldSizes={fieldSizes}
            onChange={(data) => onUpdateData(node.id, data)}
            onFieldFocus={() => {
              if (!selected) queueMicrotask(() => onSelect(node.id, false))
            }}
          />
        )}
        {node.kind === 'markdown' && (
          <MarkdownFields
            nodeId={node.id}
            data={node.data as MarkdownData}
            accent={accent}
            fieldSizes={fieldSizes}
            onChange={(data) => onUpdateData(node.id, data)}
            onFieldFocus={() => {
              if (!selected) queueMicrotask(() => onSelect(node.id, false))
            }}
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
          />
        ))}
      </div>
    </article>
  )
}
