import { useState } from 'react'
import type { CanvasNode, Socket, SocketKind, SocketSide } from '../types'
import { SOCKET_COLORS, SOCKET_KIND_LABEL } from '../types'

type Props = {
  node: CanvasNode
  onClose: () => void
  onUpdateSocket: (socketId: string, patch: Partial<Socket>) => void
  onReorder: (socketIds: string[]) => void
  onRemove: (socketId: string) => void
  onAdd: (side: SocketSide, kind: SocketKind, name: string) => void
}

export function SocketManagerPanel({
  node,
  onClose,
  onUpdateSocket,
  onReorder,
  onRemove,
  onAdd,
}: Props) {
  const [dragId, setDragId] = useState<string | null>(null)

  const onDropOn = (targetId: string) => {
    if (!dragId || dragId === targetId) return
    const ids = node.sockets.map((s) => s.id)
    const from = ids.indexOf(dragId)
    const to = ids.indexOf(targetId)
    if (from < 0 || to < 0) return
    ids.splice(from, 1)
    ids.splice(to, 0, dragId)
    onReorder(ids)
    setDragId(null)
  }

  return (
    <div className="socket-manager" role="dialog" aria-label="节点管理" onPointerDown={(e) => e.stopPropagation()}>
      <div className="socket-manager-header">
        <strong>节点管理</strong>
        <span className="socket-manager-sub">{node.sockets.length} 个连接点</span>
        <button type="button" className="ghost-btn" onClick={onClose}>
          关闭
        </button>
      </div>

      {node.sockets.length === 0 ? (
        <div className="socket-manager-empty">当前控件没有连接点，可在下方添加。</div>
      ) : (
        <ul className="socket-manager-list">
          {node.sockets.map((s) => (
            <li
              key={s.id}
              className={`socket-manager-row${dragId === s.id ? ' dragging' : ''}`}
              draggable
              onDragStart={() => setDragId(s.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropOn(s.id)}
            >
              <span className="drag-grip" title="拖动排序">
                ⋮⋮
              </span>
              <span
                className="socket-swatch"
                style={{ background: SOCKET_COLORS[s.kind] }}
                title={SOCKET_KIND_LABEL[s.kind]}
              />
              <input
                value={s.name}
                onChange={(e) => onUpdateSocket(s.id, { name: e.target.value })}
                placeholder="名称"
              />
              <select
                value={s.kind}
                onChange={(e) => onUpdateSocket(s.id, { kind: e.target.value as SocketKind })}
              >
                {(Object.keys(SOCKET_KIND_LABEL) as SocketKind[]).map((k) => (
                  <option key={k} value={k}>
                    {SOCKET_KIND_LABEL[k]}
                  </option>
                ))}
              </select>
              <select
                value={s.side}
                onChange={(e) => onUpdateSocket(s.id, { side: e.target.value as SocketSide })}
              >
                <option value="left">左侧</option>
                <option value="right">右侧</option>
              </select>
              <button
                type="button"
                className="mini-btn"
                title="删除连接点"
                onClick={() => onRemove(s.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="socket-manager-actions">
        <button
          type="button"
          className="tool-btn"
          onClick={() => onAdd('left', 'generic', '输入')}
        >
          + 左侧
        </button>
        <button
          type="button"
          className="tool-btn"
          onClick={() => onAdd('right', 'generic', '输出')}
        >
          + 右侧
        </button>
      </div>
    </div>
  )
}
